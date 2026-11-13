import type { Database } from './database-types';
import { cartTotal } from './order-cart';
import { OrderConflictError, OrderValidationError } from './order-error';
import { validateOrderDetails, validateOrderLines } from './saved-order-validation';
import type { SavedOrder, SaveOrderInput } from './saved-order-types';

interface OrderRow {
  id: string;
  number: number;
  revision: number;
  details_json: string;
  lines_json: string;
  total_paisa: number;
  created_at: string;
  updated_at: string;
}

function readOrder(row: OrderRow): SavedOrder {
  const details: unknown = JSON.parse(row.details_json);
  const lines: unknown = JSON.parse(row.lines_json);
  validateOrderDetails(details);
  validateOrderLines(lines);
  const totalPaisa = cartTotal(lines);
  if (totalPaisa !== row.total_paisa || !Number.isSafeInteger(row.number) || row.number < 1 ||
      !Number.isSafeInteger(row.revision) || row.revision < 1 ||
      !Number.isFinite(Date.parse(row.created_at)) || !Number.isFinite(Date.parse(row.updated_at))) {
    throw new Error('The saved order could not be read. Its stored data has not been changed.');
  }
  return { id: row.id, number: row.number, revision: row.revision, details, lines, totalPaisa,
    createdAt: row.created_at, updatedAt: row.updated_at };
}

export function createSavedOrderStore(database: Database) {
  async function get(id: string): Promise<SavedOrder> {
    const [row] = await database.query<OrderRow>('SELECT * FROM open_orders WHERE id = ?', [id]);
    if (!row) throw new OrderValidationError('This saved order could not be found. Your current draft is unchanged.');
    return readOrder(row);
  }

  return {
    get,
    async list(): Promise<SavedOrder[]> {
      const rows = await database.query<OrderRow>('SELECT * FROM open_orders ORDER BY updated_at DESC, number DESC');
      return rows.map(readOrder);
    },

    async save(input: SaveOrderInput): Promise<SavedOrder> {
      const snapshot = structuredClone(input);
      validateOrderDetails(snapshot.details);
      validateOrderLines(snapshot.lines);
      if (typeof snapshot.id !== 'string' || !snapshot.id.trim() || snapshot.id.length > 100 ||
          !Number.isSafeInteger(snapshot.expectedRevision) || snapshot.expectedRevision < 0 || snapshot.expectedRevision >= Number.MAX_SAFE_INTEGER) {
        throw new OrderValidationError('This order has an invalid ID or revision. Reopen it and try again.');
      }
      const details = JSON.stringify(snapshot.details);
      const lines = JSON.stringify(snapshot.lines);
      const total = cartTotal(snapshot.lines);
      const now = new Date().toISOString();
      try {
        await database.write([snapshot.expectedRevision === 0 ? {
          statement: `INSERT INTO open_orders(id, revision, details_json, lines_json, total_paisa, created_at, updated_at)
            VALUES (?, 1, ?, ?, ?, ?, ?)`, values: [snapshot.id, details, lines, total, now, now],
        } : {
          // A stale update fails the NOT NULL constraint and rolls back atomically.
          statement: `UPDATE open_orders SET details_json = ?, lines_json = ?, total_paisa = ?,
            updated_at = ?, revision = CASE WHEN revision = ? THEN revision + 1 ELSE NULL END WHERE id = ?`,
          values: [details, lines, total, now, snapshot.expectedRevision, snapshot.id],
        }]);
      } catch (failure) {
        const existing = await get(snapshot.id).catch(() => null);
        // Retrying an acknowledged-late write never creates a duplicate order.
        if (existing?.revision === snapshot.expectedRevision + 1 &&
            JSON.stringify(existing.details) === details && JSON.stringify(existing.lines) === lines) return existing;
        if (existing && existing.revision !== snapshot.expectedRevision) throw new OrderConflictError();
        throw failure;
      }
      return get(snapshot.id);
    },
  };
}

export type SavedOrderStore = ReturnType<typeof createSavedOrderStore>;
