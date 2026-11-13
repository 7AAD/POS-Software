import { useState } from 'react';
import { formatPkr } from '../data/money';
import { orderErrorMessage } from '../data/order-error';
import type { OrderCartState } from '../data/use-order-cart';
import { AppIcon } from './AppIcon';

export function OrderSaveBar({ cart, onNew }: { cart: OrderCartState; onNew(): void }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const saved = Boolean(cart.activeOrder && !cart.dirty);
  const label = saved ? 'Order saved' : cart.activeOrder ? 'Save changes' : 'Save order';
  async function save() {
    setError(''); setMessage('');
    try {
      const order = await cart.save();
      setMessage(`Order #${order.number} saved on this device.`);
    } catch (failure) {
      setError(orderErrorMessage(failure, 'Could not save this order. Your changes are still here. Please try again.'));
    }
  }
  async function checkout() {
    setError(''); setMessage('');
    try {
      const order = await cart.save();
      window.location.hash = `#checkout/${encodeURIComponent(order.id)}`;
    } catch (failure) {
      setError(orderErrorMessage(failure, 'Could not save the order for checkout. Your current changes are still here.'));
    }
  }
  return (
    <div className="order-save-bar">
      <div className="checkout-entry-actions">
      <button type="button" className="order-review secondary" aria-label={label}
        disabled={cart.busy || cart.lines.length === 0 || saved} onClick={() => void save()}>
        {cart.busy ? 'Please wait…' : label}
      </button>
      <button type="button" className="order-review" aria-label="Checkout" disabled={cart.busy || cart.lines.length === 0}
        onClick={() => void checkout()}>Checkout · {formatPkr(cart.totalPaisa)}</button>
      </div>
      <div className="order-secondary-actions">
        <button type="button" className="secondary" disabled={cart.busy} onClick={onNew}><AppIcon name="plus" />New order</button>
        <a className="button-link secondary" href="#orders"><AppIcon name="clock" />Open orders</a>
      </div>
      {error && <p role="alert" className="form-error order-save-error">{error}</p>}
      <p className="order-draft-note" role="status" aria-live="polite">
        {saved ? message || `Order #${cart.activeOrder!.number} is saved on this device.` :
          cart.dirty && cart.lines.length === 0 ? 'Add an item to save, or start a new order.' :
            cart.dirty ? 'Unsaved changes · save before closing the app.' : 'Save an order to keep it after closing the app.'}
      </p>
    </div>
  );
}
