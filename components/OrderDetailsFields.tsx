import { useId } from 'react';
import type { OrderDetails } from '../data/order-types';

interface OrderDetailsFieldsProps {
  value: OrderDetails;
  onChange(value: OrderDetails): void;
}

export function OrderDetailsFields({ value, onChange }: OrderDetailsFieldsProps) {
  const id = useId();
  return (
    <div className="order-details">
      <div className="select-field"><label htmlFor={`${id}-type`}>Order type</label>
        <select id={`${id}-type`} value={value.type}
          onChange={event => onChange({ ...value, type: event.target.value as OrderDetails['type'] })}>
          <option value="dine-in">Dine-in</option><option value="takeaway">Takeaway</option><option value="delivery">Delivery</option>
        </select>
      </div>
      {value.type === 'dine-in' && <label>Table (optional)<input value={value.table} maxLength={30}
        onChange={event => onChange({ ...value, table: event.target.value })} placeholder="e.g. 3" /></label>}
      <label>Customer name (optional)<input value={value.customerName} maxLength={100} autoComplete="name"
        onChange={event => onChange({ ...value, customerName: event.target.value })} /></label>
      <label>Phone (optional)<input type="tel" value={value.customerPhone} maxLength={30} autoComplete="tel"
        onChange={event => onChange({ ...value, customerPhone: event.target.value })} /></label>
    </div>
  );
}
