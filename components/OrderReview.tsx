import { formatPkr } from '../data/money';
import { orderTypeLabels } from '../data/order-types';
import type { OrderSnapshot } from '../data/saved-order-types';
import { OrderLineDetails } from './OrderLineDetails';

export function OrderReview({ number, totalPaisa, details, lines }: OrderSnapshot & { number: number; totalPaisa: number }) {
  return <section className="order-review-panel" aria-label="Order details">
    <h2>Order #{number}</h2>
    <p className="saved-order-type">{orderTypeLabels[details.type]}{details.type === 'dine-in' && details.table ? ` · Table ${details.table}` : ''}</p>
    {details.customerName && <p className="saved-order-customer">{details.customerName}</p>}
    {details.customerPhone && <p className="saved-order-phone">{details.customerPhone}</p>}
    <ul className="readonly-order-lines" aria-label="Order line details">
      {lines.map(line => <li className="cart-line" key={line.id}>
        <div className="readonly-line-heading"><h3>{line.quantity} × {line.itemName}</h3>
          <strong>{formatPkr(line.unitPricePaisa * line.quantity)}</strong></div>
        <p className="readonly-line-size">{line.variantName} · {formatPkr(line.unitPricePaisa)} each</p>
        <OrderLineDetails line={line} />
      </li>)}
    </ul>
    <div className="checkout-total"><span>Order total</span><strong>{formatPkr(totalPaisa)}</strong></div>
    <p className="field-help">No discounts, tax, or delivery fee added.</p>
  </section>;
}
