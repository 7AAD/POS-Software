import type { Database } from './database-types';
import { OrderConflictError, OrderPaidError, OrderValidationError } from './order-error';
import { readOrderSnapshot } from './order-snapshot';
import { validatePayment } from './payment-validation';
import type { CompletedSale, PaymentInput, PaymentMethod } from './payment-types';
import { createSavedOrderStore } from './saved-order-store';
import type { SavedOrder } from './saved-order-types';

interface SaleRow {
  id: string;
  order_id: string;
  order_number: number;
  order_revision: number;
  details_json: string;
  lines_json: string;
  total_paisa: number;
  method: PaymentMethod;
  received_paisa: number;
  change_paisa: number;
  confirmed_received: number;
  reference: string;
  paid_at: string;
}

function readSale(row: SaleRow): CompletedSale {
  const snapshot = readOrderSnapshot(row.details_json, row.lines_json, row.total_paisa);
  const amounts = validatePayment({ id: row.id, orderId: row.order_id,
    expectedRevision: row.order_revision, expectedTotalPaisa: row.total_paisa,
    method: row.method, receivedPaisa: row.received_paisa,
    confirmedReceived: row.confirmed_received === 1, reference: row.reference });
  if (amounts.changePaisa !== row.change_paisa || !Number.isSafeInteger(row.order_number) || row.order_number < 1 ||
      ![0, 1].includes(row.confirmed_received) || !Number.isFinite(Date.parse(row.paid_at))) {
    throw new Error('This completed sale could not be read. Its stored record has not been changed.');
  }
  return { ...snapshot, id: row.id, orderId: row.order_id, orderNumber: row.order_number,
    orderRevision: row.order_revision, totalPaisa: row.total_paisa, method: row.method,
    receivedPaisa: row.received_paisa, changePaisa: row.change_paisa,
    confirmedReceived: row.confirmed_received === 1, reference: row.reference, paidAt: row.paid_at };
}

function samePayment(sale: CompletedSale, input: PaymentInput): boolean {
  return sale.id === input.id && sale.orderId === input.orderId && sale.orderRevision === input.expectedRevision &&
    sale.totalPaisa === input.expectedTotalPaisa && sale.method === input.method &&
    sale.receivedPaisa === input.receivedPaisa && sale.confirmedReceived === input.confirmedReceived &&
    sale.reference === input.reference.trim();
}

function recordedPayment(sale: CompletedSale, input: PaymentInput): CompletedSale {
  if (!samePayment(sale, input)) throw new OrderPaidError();
  return sale;
}

export function createSalesStore(database: Database) {
  async function findForOrder(orderId: string): Promise<CompletedSale | null> {
    const [row] = await database.query<SaleRow>('SELECT * FROM sales WHERE order_id = ?', [orderId]);
    return row ? readSale(row) : null;
  }

  async function get(id: string): Promise<CompletedSale> {
    const [row] = await database.query<SaleRow>('SELECT * FROM sales WHERE id = ?', [id]);
    if (!row) throw new OrderValidationError('This completed sale could not be found.');
    return readSale(row);
  }

  return {
    get, findForOrder,
    async list(): Promise<CompletedSale[]> {
      return (await database.query<SaleRow>('SELECT * FROM sales ORDER BY paid_at DESC, order_number DESC')).map(readSale);
    },
    async pay(input: PaymentInput): Promise<CompletedSale> {
      const payment = structuredClone(input);
      validatePayment(payment);
      const existing = await findForOrder(payment.orderId);
      if (existing) return recordedPayment(existing, payment);
      let order: SavedOrder;
      try { order = await createSavedOrderStore(database).get(payment.orderId); }
      catch (failure) {
        const recorded = await findForOrder(payment.orderId).catch(() => null);
        if (recorded) return recordedPayment(recorded, payment);
        throw failure;
      }
      if (order.revision !== payment.expectedRevision || order.totalPaisa !== payment.expectedTotalPaisa) throw new OrderConflictError();
      try {
        await database.write([
          {
            // Copy the saved snapshot, provided its revision and total still match.
            statement: `INSERT INTO sales(id, order_id, order_number, order_revision, details_json,
                lines_json, total_paisa, method, received_paisa, change_paisa, confirmed_received, reference, paid_at)
              SELECT ?, id, number, revision, details_json, lines_json, total_paisa, ?, ?, ? - total_paisa, ?, ?, ?
              FROM open_orders WHERE id = ? AND revision = ? AND total_paisa = ? AND status = 'open'`,
            values: [payment.id, payment.method, payment.receivedPaisa, payment.receivedPaisa,
              Number(payment.confirmedReceived), payment.reference.trim(), new Date().toISOString(),
              payment.orderId, payment.expectedRevision, payment.expectedTotalPaisa],
          },
          {
            statement: `UPDATE open_orders SET status = 'paid', revision = revision + 1
              WHERE id = ? AND revision = ? AND status = 'open'
                AND EXISTS(SELECT 1 FROM sales WHERE id = ? AND order_id = open_orders.id)`,
            values: [payment.orderId, payment.expectedRevision, payment.id],
          },
        ]);
      } catch (failure) {
        const recorded = await findForOrder(payment.orderId).catch(() => null);
        if (recorded) return recordedPayment(recorded, payment);
        throw failure;
      }
      const recorded = await findForOrder(payment.orderId);
      if (!recorded) throw new OrderConflictError();
      return recordedPayment(recorded, payment);
    },
  };
}

export type SalesStore = ReturnType<typeof createSalesStore>;
