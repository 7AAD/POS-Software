import { formatPkr } from '../data/money';
import { orderTypeLabels } from '../data/order-types';
import { paymentMethods, type CompletedSale } from '../data/payment-types';
import { AppIcon } from './AppIcon';
import { OrderLineDetails } from './OrderLineDetails';

export function ReceiptDocument({ sale }: { sale: CompletedSale }) {
  const method = paymentMethods.find(entry => entry.value === sale.method)?.label;
  return (
    <article className="receipt-paper" aria-label={`Receipt for order #${sale.orderNumber}`}>
      <header className="receipt-brand">
        <span className="receipt-logo"><AppIcon name="utensils" /></span>
        <h2>MASTER FOODS</h2>
        <p>Customer receipt</p>
      </header>
      <div className="receipt-order-heading"><h3>Order #{sale.orderNumber}</h3><span className="receipt-paid">PAID</span></div>
      <dl className="receipt-metadata">
        <div><dt>Paid on</dt><dd><time dateTime={sale.paidAt}>
          {new Date(sale.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </time></dd></div>
        <div><dt>Order type</dt><dd>{orderTypeLabels[sale.details.type]}</dd></div>
        {sale.details.type === 'dine-in' && sale.details.table && <div><dt>Table</dt><dd>{sale.details.table}</dd></div>}
        {sale.details.customerName && <div><dt>Customer</dt><dd>{sale.details.customerName}</dd></div>}
        {sale.details.customerPhone && <div><dt>Phone</dt><dd>{sale.details.customerPhone}</dd></div>}
      </dl>
      <ul className="receipt-items" aria-label="Receipt items">
        {sale.lines.map(line => <li className="receipt-item" key={line.id}>
          <div className="receipt-item-heading"><h4>{line.quantity} × {line.itemName}</h4>
            <strong>{formatPkr(line.unitPricePaisa * line.quantity)}</strong></div>
          <p className="receipt-item-size">{line.variantName} · {formatPkr(line.unitPricePaisa)} each</p>
          <OrderLineDetails line={line} />
        </li>)}
      </ul>
      <div className="receipt-total"><span>Total</span><strong>{formatPkr(sale.totalPaisa)}</strong></div>
      <dl className="receipt-payment" aria-label="Receipt payment">
        <div><dt>Payment method</dt><dd>{method}</dd></div>
        <div><dt>Amount received</dt><dd>{formatPkr(sale.receivedPaisa)}</dd></div>
        {sale.method === 'cash' && <div><dt>Change</dt><dd>{formatPkr(sale.changePaisa)}</dd></div>}
        {sale.reference && <div><dt>Payment reference</dt><dd>{sale.reference}</dd></div>}
      </dl>
      <footer className="receipt-footer"><p>Thank you for your order!</p><span>All amounts in PKR</span></footer>
    </article>
  );
}
