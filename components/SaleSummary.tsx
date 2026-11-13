import { formatPkr } from '../data/money';
import { paymentMethods, type CompletedSale } from '../data/payment-types';
import { AppIcon } from './AppIcon';
import { OrderReview } from './OrderReview';

export function SaleSummary({ sale, onNew, alreadyRecorded = false }: {
  sale: CompletedSale; onNew(): void; alreadyRecorded?: boolean;
}) {
  return <>
    <div className="payment-success" role="status"><AppIcon name="check" />
      {alreadyRecorded ? 'Payment already recorded' : 'Payment recorded'}</div>
    <div className="checkout-layout">
      <OrderReview number={sale.orderNumber} totalPaisa={sale.totalPaisa} details={sale.details} lines={sale.lines} />
      <section className="payment-panel" aria-label="Payment details">
        <h2>Paid · {paymentMethods.find(method => method.value === sale.method)?.label}</h2>
        <dl className="payment-amounts">
          <div><dt>Total paid</dt><dd>{formatPkr(sale.totalPaisa)}</dd></div>
          <div><dt>Amount received</dt><dd>{formatPkr(sale.receivedPaisa)}</dd></div>
          {sale.method === 'cash' && <div><dt>Change to return</dt><dd>{formatPkr(sale.changePaisa)}</dd></div>}
          {sale.reference && <div><dt>Reference</dt><dd>{sale.reference}</dd></div>}
        </dl>
        <p className="saved-order-time">{new Date(sale.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
        <p className="field-help">Saved on this device. This completed sale is read-only.</p>
        <div className="payment-actions"><button type="button" onClick={onNew}><AppIcon name="plus" />New order</button>
          <a className="button-link secondary" href="#sales">Paid orders</a></div>
      </section>
    </div>
  </>;
}
