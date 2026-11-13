import { maxOrderQuantity } from '../data/order-types';
import { AppIcon } from './AppIcon';

interface QuantityControlProps {
  name: string;
  quantity: number;
  onChange(value: number): void;
}

export function QuantityControl({ name, quantity, onChange }: QuantityControlProps) {
  return (
    <div className="quantity-control" role="group" aria-label={`Quantity for ${name}`}>
      <button type="button" className="icon-button secondary" aria-label={`Decrease ${name} quantity`}
        disabled={quantity <= 1} onClick={() => onChange(quantity - 1)}><AppIcon name="minus" /></button>
      <output aria-label={`${name} quantity`}>{quantity}</output>
      <button type="button" className="icon-button secondary" aria-label={`Increase ${name} quantity`}
        disabled={quantity >= maxOrderQuantity} onClick={() => onChange(quantity + 1)}><AppIcon name="plus" /></button>
    </div>
  );
}
