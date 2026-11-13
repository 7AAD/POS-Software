import type { FormEvent } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { OrderReview } from '../components/OrderReview';
import { SaleSummary } from '../components/SaleSummary';
import { SelectionTabs } from '../components/SelectionTabs';
import { StatusCard } from '../components/StatusCard';
import { formatPkr } from '../data/money';
import { paymentMethods, type PaymentMethod } from '../data/payment-types';
import { useCheckout } from '../data/use-checkout';
import type { OrderCartState } from '../data/use-order-cart';

export function Checkout({ orderId, cart, onNew }: { orderId: string; cart: OrderCartState; onNew(): void }) {
  const checkout = useCheckout(orderId, cart);
  const unsavedCurrent = cart.id === orderId && cart.dirty;
  function submit(event: FormEvent) { event.preventDefault(); void checkout.submit(); }
  return <div className="app-shell checkout-shell">
    <AppHeader compact />
    <main>
      <a className="back-link" href="#order" aria-disabled={cart.busy} onClick={event => { if (cart.busy) event.preventDefault(); }}><AppIcon name="back" />Back to POS</a>
      <div className="checkout-heading"><h1>Checkout</h1><p>Review the order and record the payment received.</p></div>
      {checkout.loading && <StatusCard title="Opening checkout" tone="loading"><p role="status">Please wait…</p></StatusCard>}
      {checkout.loadError && <StatusCard title="Checkout could not be opened" tone="error">
        <p role="alert">Please try again. The order has not been changed.</p><button type="button" onClick={checkout.retry}>Try again</button>
        <a className="back-link" href="#orders">Open orders</a>
      </StatusCard>}
      {!checkout.loading && !checkout.loadError && checkout.sale && <SaleSummary sale={checkout.sale} onNew={onNew} alreadyRecorded />}
      {!checkout.loading && !checkout.loadError && checkout.order && unsavedCurrent && <StatusCard title="Save changes before checkout" tone="error">
        <p role="alert">The current cart has unsaved edits. Return to POS and choose Checkout to save and review the updated total.</p>
        <a className="button-link" href="#order">Review unsaved changes</a>
      </StatusCard>}
      {!checkout.loading && !checkout.loadError && checkout.order && !unsavedCurrent && <div className="checkout-layout">
        <OrderReview number={checkout.order.number} totalPaisa={checkout.order.totalPaisa} details={checkout.order.details} lines={checkout.order.lines} />
        <form className="payment-panel" onSubmit={submit}>
          <fieldset disabled={cart.busy} className="payment-fields" aria-busy={cart.busy}>
            <h2>Payment method</h2>
            <SelectionTabs label="Payment method" className="payment-methods" options={[...paymentMethods]}
              value={checkout.method} onChange={value => checkout.setMethod(value as PaymentMethod)} />
            {checkout.method === 'cash' ? <>
              <label>Cash received (Rs.)<input type="number" min="0" step="0.01" inputMode="decimal" required
                value={checkout.amount} onChange={event => checkout.setAmount(event.target.value)} /></label>
              <button type="button" className="secondary exact-amount" onClick={checkout.exactAmount}>Exact amount</button>
              {checkout.amountError && <p className="form-error">{checkout.amountError}</p>}
            </> : <>
              <p className="digital-amount">Amount received <strong>{formatPkr(checkout.order.totalPaisa)}</strong></p>
              <label>Transaction reference (optional)<input maxLength={100} value={checkout.reference}
                onChange={event => checkout.setReference(event.target.value)} /></label>
              <label className="digital-confirmation"><input type="checkbox" checked={checkout.confirmed}
                onChange={event => checkout.setConfirmed(event.target.checked)} />I confirmed the money was received</label>
              <p className="field-help">Check your {paymentMethods.find(method => method.value === checkout.method)?.label} receipt outside the app before recording it.</p>
            </>}
            <dl className="payment-amounts">
              <div><dt>Total due</dt><dd>{formatPkr(checkout.order.totalPaisa)}</dd></div>
              {checkout.method === 'cash' && checkout.preview && <div><dt>Change to return</dt><dd>{formatPkr(checkout.preview.changePaisa)}</dd></div>}
            </dl>
            {checkout.error && <p role="alert" className="form-error">{checkout.error}</p>}
            <button type="submit" className="record-payment" disabled={!checkout.canSubmit}>{cart.busy ? 'Recording…' : 'Record payment'}</button>
            <p className="field-help">This records the full payment and keeps a read-only sale on this device.</p>
          </fieldset>
        </form>
      </div>}
    </main>
  </div>;
}
