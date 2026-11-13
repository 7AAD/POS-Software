import { useEffect, useRef, useState } from 'react';
import { getSavedOrderStore, getSalesStore } from './client';
import type { PaymentInput } from './payment-types';
import { OrderValidationError } from './order-error';
import type { MenuItem } from './menu-types';
import { addCartLine, cartTotal, changeCartQuantity, createCartLine } from './order-cart';
import { emptyOrderDetails, type CartLine, type OrderDetails, type OrderSelections } from './order-types';
import type { SavedOrder } from './saved-order-types';

interface Draft {
  id: string;
  lines: CartLine[];
  details: OrderDetails;
  activeOrder: SavedOrder | null;
}

function emptyDraft(): Draft {
  return { id: crypto.randomUUID(), lines: [], details: { ...emptyOrderDetails }, activeOrder: null };
}

function hasChanges(draft: Draft): boolean {
  const baseline = draft.activeOrder ?? { lines: [], details: emptyOrderDetails };
  return JSON.stringify({ lines: draft.lines, details: draft.details }) !==
    JSON.stringify({ lines: baseline.lines, details: baseline.details });
}

// App owns the working draft. Only a successful durable write marks it saved.
export function useOrderCart() {
  const [state, setState] = useState<Draft>(emptyDraft);
  const current = useRef(state);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const dirty = hasChanges(state);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    if (dirty) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function ensureIdle() {
    if (locked.current) throw new Error('Please wait for this order to finish saving or opening.');
  }

  function commit(next: Draft) {
    current.current = next;
    setState(next);
  }

  function add(item: MenuItem, menu: MenuItem[], variantId: string, quantity: number,
    selections: OrderSelections, notes: string) {
    ensureIdle();
    commit({ ...current.current, lines: addCartLine(current.current.lines,
      createCartLine(item, menu, variantId, quantity, selections, notes)) });
  }

  function changeQuantity(id: string, quantity: number) {
    ensureIdle();
    commit({ ...current.current, lines: changeCartQuantity(current.current.lines, id, quantity) });
  }

  function setDetails(details: OrderDetails) { ensureIdle(); commit({ ...current.current, details }); }
  function remove(id: string) { ensureIdle(); commit({ ...current.current, lines: current.current.lines.filter(line => line.id !== id) }); }
  function clear() { ensureIdle(); commit(emptyDraft()); }

  async function save(): Promise<SavedOrder> {
    ensureIdle();
    const draft = current.current;
    if (draft.activeOrder && !hasChanges(draft)) return draft.activeOrder;
    locked.current = true; setBusy(true);
    try {
      const saved = await (await getSavedOrderStore()).save({ id: draft.id,
        expectedRevision: draft.activeOrder?.revision ?? 0, lines: draft.lines, details: draft.details });
      commit({ ...draft, activeOrder: saved });
      return saved;
    } finally { locked.current = false; setBusy(false); }
  }

  async function open(id: string, reload = false) {
    ensureIdle();
    if (current.current.activeOrder?.id === id && !reload) return;
    locked.current = true; setBusy(true);
    try {
      const saved = await (await getSavedOrderStore()).get(id);
      // Read and validate before replacing anything in the current draft.
      commit({ id: saved.id, lines: structuredClone(saved.lines), details: { ...saved.details }, activeOrder: saved });
    } finally { locked.current = false; setBusy(false); }
  }

  async function recordPayment(input: PaymentInput) {
    ensureIdle();
    if (current.current.id === input.orderId && hasChanges(current.current)) {
      throw new OrderValidationError('Save the current cart changes before recording payment.');
    }
    locked.current = true; setBusy(true);
    try {
      const sale = await (await getSalesStore()).pay(input);
      if (current.current.id === sale.orderId) commit(emptyDraft());
      return sale;
    } finally { locked.current = false; setBusy(false); }
  }

  return { ...state, setDetails, add, changeQuantity, remove, clear, save, open, recordPayment, busy, dirty,
    totalPaisa: cartTotal(state.lines), quantity: state.lines.reduce((count, line) => count + line.quantity, 0) };
}

export type OrderCartState = ReturnType<typeof useOrderCart>;
