import type { MenuItem } from '../data/menu-types';
import { formatPkr } from '../data/money';
import { AppIcon } from './AppIcon';

interface MenuItemCardProps {
  item: MenuItem;
  categoryName: string;
  onEdit?(): void;
  onSelect?(): void;
}

export function MenuItemCard({ item, categoryName, onEdit, onSelect }: MenuItemCardProps) {
  if (onSelect) {
    const price = Math.min(...item.variants.map(variant => variant.pricePaisa));
    return <article className="order-product" aria-label={item.name}>
      <button type="button" className="product-choice" disabled={!item.active}
        aria-label={`Choose ${item.name}`} onClick={onSelect}>
        <span className="product-image"><AppIcon name="utensils" /></span>
        <h3>{item.name}</h3>
        <span className="product-price">
          <span>{item.active ? <>{item.variants.length > 1 ? 'From ' : ''}{formatPkr(price)}</> : 'Unavailable'}</span>
          <AppIcon name="plusCircle" />
        </span>
      </button>
    </article>;
  }
  return (
    <article className="menu-item" aria-label={item.name}>
      <div className="menu-item-heading">
        <div><p className="item-category">{categoryName}</p><h3>{item.name}</h3></div>
        {onEdit && <button type="button" className="icon-button secondary" aria-label={`Edit ${item.name}`} onClick={onEdit}>
          <AppIcon name="edit" />
        </button>}
      </div>
      {item.description && <p className="item-description">{item.description}</p>}
      <ul className="item-prices">
        {item.variants.map(variant => <li key={variant.id}>
          <span>{variant.name}</span><strong>{formatPkr(variant.pricePaisa)}</strong>
        </li>)}
      </ul>
      <span className={`availability ${item.active ? '' : 'unavailable'}`}>
        {item.active ? 'Available' : 'Unavailable'}
      </span>
      {item.premiumExtraRequired && <p className="premium-note">
        Premium extra per pizza: {item.premiumExtraPaisa == null ? 'amount not set' : formatPkr(item.premiumExtraPaisa)}
      </p>}
    </article>
  );
}
