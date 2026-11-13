import { useRef, useState } from 'react';
import { orderErrorMessage } from './order-error';
import type { OrderCartState } from './use-order-cart';

type Destination = { kind: 'new' } | { kind: 'open'; id: string; reload: boolean };

export function useOrderNavigation(cart: OrderCartState) {
  const [pending, setPending] = useState<Destination | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const locked = useRef(false);

  async function proceed(destination: Destination, save: boolean) {
    if (locked.current || cart.busy) return;
    locked.current = true; setWorking(true); setError('');
    try {
      if (save) await cart.save();
      if (destination.kind === 'new') cart.clear();
      else await cart.open(destination.id, destination.reload);
      setPending(null);
      window.location.hash = '#order';
    } catch (failure) {
      setError(orderErrorMessage(failure, save ?
        'Could not save or switch orders. Your current changes are still here. Please try again.' :
        'Could not open this order. Your current draft is unchanged. Please try again.'));
    } finally { locked.current = false; setWorking(false); }
  }

  function request(destination: Destination) {
    if (locked.current || cart.busy) return;
    setError('');
    if (destination.kind === 'open' && destination.id === cart.activeOrder?.id && !destination.reload) {
      window.location.hash = '#order';
    } else if (cart.dirty) setPending(destination);
    else void proceed(destination, false);
  }

  function cancel() {
    if (locked.current) return;
    setPending(null); setError(''); window.location.hash = '#order';
  }

  return { pending, error, working, requestNew: () => request({ kind: 'new' }),
    requestOpen: (id: string, revision: number) => request({ kind: 'open', id,
      reload: cart.activeOrder?.id === id && cart.activeOrder.revision !== revision }), cancel,
    dismissError: () => setError(''),
    saveAndContinue: () => { if (pending) void proceed(pending, true); },
    discardAndContinue: () => { if (pending) void proceed(pending, false); } };
}

export type OrderNavigation = ReturnType<typeof useOrderNavigation>;
