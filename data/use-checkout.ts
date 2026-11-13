import { useEffect, useRef, useState } from 'react';
import { getSavedOrderStore, getSalesStore } from './client';
import { parsePkr, priceForInput } from './money';
import { orderErrorMessage } from './order-error';
import { paymentAmounts } from './payment-validation';
import type { CompletedSale, PaymentMethod } from './payment-types';
import type { SavedOrder } from './saved-order-types';
import type { OrderCartState } from './use-order-cart';

export function useCheckout(orderId: string, cart: OrderCartState) {
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [sale, setSale] = useState<CompletedSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [paymentId] = useState(() => crypto.randomUUID());
  const submitting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(false);
    void (async () => {
      try {
        const sales = await getSalesStore();
        let recorded = await sales.findForOrder(orderId);
        let saved: SavedOrder | null = null;
        if (!recorded) {
          try { saved = await (await getSavedOrderStore()).get(orderId); }
          catch (failure) { recorded = await sales.findForOrder(orderId); if (!recorded) throw failure; }
        }
        if (!cancelled) { setOrder(saved); setSale(recorded); }
      } catch { if (!cancelled) setLoadError(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [orderId, attempt]);

  let preview: ReturnType<typeof paymentAmounts> | null = null;
  let amountError = '';
  if (order) {
    try { preview = paymentAmounts(order.totalPaisa, method, method === 'cash' ? parsePkr(amount) : order.totalPaisa); }
    catch (failure) { if (amount.trim()) amountError = failure instanceof Error ? failure.message : 'Check the received amount.'; }
  }

  async function submit() {
    if (!order || submitting.current || cart.busy) return;
    submitting.current = true; setError('');
    try {
      const recorded = await cart.recordPayment({ id: paymentId, orderId,
        expectedRevision: order.revision, expectedTotalPaisa: order.totalPaisa,
        method, receivedPaisa: method === 'cash' ? parsePkr(amount) : order.totalPaisa,
        confirmedReceived: method === 'cash' ? false : confirmed, reference: method === 'cash' ? '' : reference });
      window.location.hash = `#sale/${encodeURIComponent(recorded.id)}`;
    } catch (failure) {
      setError(orderErrorMessage(failure,
        'Could not confirm the payment record. Retry or check Paid orders. Your order details are retained.'));
    } finally { submitting.current = false; }
  }

  return { order, sale, loading, loadError, retry: () => setAttempt(value => value + 1),
    method, setMethod: (value: PaymentMethod) => { setMethod(value); setConfirmed(false); setReference(''); setError(''); },
    amount, setAmount, reference, setReference, confirmed, setConfirmed, preview, amountError, error,
    exactAmount: () => { if (order) setAmount(priceForInput(order.totalPaisa)); }, submit,
    canSubmit: Boolean(preview && (method === 'cash' || confirmed) && !cart.busy) };
}
