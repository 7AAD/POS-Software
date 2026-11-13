import { useState } from 'react';
import type { OrderCartState } from '../data/use-order-cart';
import { formatPkr } from '../data/money';
import { AppIcon } from './AppIcon';
import { Modal } from './Modal';
import { QuantityControl } from './QuantityControl';

export function OrderCart({ cart }: { cart: OrderCartState }) {
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  return (
    <section id="current-order" className="order-cart" aria-labelledby="cart-title" tabIndex={-1}>
      <div className="cart-heading"><h2 id="cart-title">Current Order</h2>
        <span className="cart-item-count" aria-live="polite">{cart.quantity} {cart.quantity === 1 ? 'item' : 'items'}</span></div>
      {cart.lines.length === 0 ? <div className="empty-cart">
        <p>Tap an item to add it to the order.</p>
      </div> : <>
        <ul className="cart-lines" aria-label="Order items">
          {cart.lines.map(line => <li className="cart-line" key={line.id}>
            <div className="cart-line-heading"><div><h3>{line.itemName}</h3><p>{line.variantName} · {formatPkr(line.unitPricePaisa)} each</p></div>
              <button type="button" className="icon-button secondary" aria-label={`Remove ${line.itemName} ${line.variantName}`}
                onClick={() => { cart.remove(line.id); setError(''); }}><AppIcon name="remove" /></button>
            </div>
            {line.description && <p className="cart-contents">{line.description}</p>}
            {line.choices.length > 0 && <ul className="cart-choices">
              {line.choices.map((choice, index) => <li key={index}>{choice.label}: {choice.name}{choice.premium ? ' (premium)' : ''}</li>)}
            </ul>}
            {line.premiumPaisa > 0 && <p className="premium-note">Includes {formatPkr(line.premiumPaisa)} premium extras per bundle.</p>}
            {line.notes && <p className="cart-instructions">Note: {line.notes}</p>}
            <div className="cart-line-bottom">
              <QuantityControl name={`${line.itemName} ${line.variantName}`} quantity={line.quantity}
                onChange={quantity => {
                  try { cart.changeQuantity(line.id, quantity); setError(''); }
                  catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not change quantity.'); }
                }} />
              <strong>{formatPkr(line.unitPricePaisa * line.quantity)}</strong>
            </div>
          </li>)}
        </ul>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="cart-total" aria-live="polite" aria-atomic="true">
          <div><span>Order total</span><strong>{formatPkr(cart.totalPaisa)}</strong></div>
          <p>{cart.quantity} {cart.quantity === 1 ? 'item' : 'items'} · No discounts, tax, or delivery fee added</p>
        </div>
        <button type="button" className="secondary clear-cart" onClick={() => setClearing(true)}><AppIcon name="remove" />Clear order</button>
      </>}
      {clearing && <Modal title="Clear this order?" onClose={() => setClearing(false)}>
        <p>Remove every item and the customer details from this draft?</p>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={() => setClearing(false)}>Keep order</button>
          <button type="button" onClick={() => { cart.clear(); setError(''); setClearing(false); }}>Clear order</button>
        </div>
      </Modal>}
    </section>
  );
}
