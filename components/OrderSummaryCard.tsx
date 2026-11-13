import type { ReactNode } from 'react';
import { formatPkr } from '../data/money';
import { orderTypeLabels, type CartLine, type OrderDetails } from '../data/order-types';

interface OrderSummaryCardProps {
  number: number;
  totalPaisa: number;
  details: OrderDetails;
  lines: CartLine[];
  timestamp: string;
  note?: ReactNode;
  children: ReactNode;
}

export function OrderSummaryCard({ number, totalPaisa, details, lines, timestamp, note, children }: OrderSummaryCardProps) {
  const quantity = lines.reduce((count, line) => count + line.quantity, 0);
  return (
    <article className="saved-order-card" aria-label={`Order #${number}`}>
      <div className="saved-order-heading"><h2>Order #{number}</h2><strong>{formatPkr(totalPaisa)}</strong></div>
      <p className="saved-order-type">{orderTypeLabels[details.type]}
        {details.type === 'dine-in' && details.table && ` · Table ${details.table}`}
        {' · '}{quantity} {quantity === 1 ? 'item' : 'items'}</p>
      {details.customerName && <p className="saved-order-customer">{details.customerName}</p>}
      {details.customerPhone && <p className="saved-order-phone">{details.customerPhone}</p>}
      <p className="saved-order-preview">{lines.map(line => `${line.quantity} × ${line.itemName}`).join(', ')}</p>
      <p className="saved-order-time">{new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
      {note && <p className="saved-order-editing">{note}</p>}
      {children}
    </article>
  );
}
