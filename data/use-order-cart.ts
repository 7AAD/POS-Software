import { useEffect, useRef, useState } from 'react';
import type { MenuItem } from './menu-types';
import { addCartLine, cartTotal, changeCartQuantity, createCartLine } from './order-cart';
import { emptyOrderDetails, type CartLine, type OrderDetails, type OrderSelections } from './order-types';

// App owns this hook so navigating to Home or Manage menu keeps the current cart.
// Durable open orders are a separate feature; reload/closing still clears it.
export function useOrderCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const current = useRef(lines);
  const [details, setDetails] = useState<OrderDetails>({ ...emptyOrderDetails });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    if (lines.length) window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [lines.length]);

  function commit(next: CartLine[]) {
    current.current = next;
    setLines(next);
  }

  function add(item: MenuItem, menu: MenuItem[], variantId: string, quantity: number,
    selections: OrderSelections, notes: string) {
    commit(addCartLine(current.current, createCartLine(item, menu, variantId, quantity, selections, notes)));
  }

  function changeQuantity(id: string, quantity: number) {
    commit(changeCartQuantity(current.current, id, quantity));
  }

  function remove(id: string) { commit(current.current.filter(line => line.id !== id)); }
  function clear() { commit([]); setDetails({ ...emptyOrderDetails }); }

  return { lines, details, setDetails, add, changeQuantity, remove, clear, totalPaisa: cartTotal(lines),
    quantity: lines.reduce((count, line) => count + line.quantity, 0) };
}

export type OrderCartState = ReturnType<typeof useOrderCart>;
