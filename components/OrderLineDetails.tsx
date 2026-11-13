import type { CartLine } from '../data/order-types';
import { formatPkr } from '../data/money';

export function OrderLineDetails({ line }: { line: CartLine }) {
  return <>
    {line.description && <p className="cart-contents">{line.description}</p>}
    {line.choices.length > 0 && <ul className="cart-choices">
      {line.choices.map((choice, index) => <li key={index}>{choice.label}: {choice.name}{choice.premium ? ' (premium)' : ''}</li>)}
    </ul>}
    {line.premiumPaisa > 0 && <p className="premium-note">Includes {formatPkr(line.premiumPaisa)} premium extras per bundle.</p>}
    {line.notes && <p className="cart-instructions">Note: {line.notes}</p>}
  </>;
}
