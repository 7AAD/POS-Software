import { useId, useState, type FormEvent } from 'react';
import type { MenuItem } from '../data/menu-types';
import { formatPkr } from '../data/money';
import { priceOrderSelection, resolveOrderGroups } from '../data/order-pricing';
import type { OrderSelections } from '../data/order-types';
import { Modal } from './Modal';
import { QuantityControl } from './QuantityControl';

interface OrderItemDialogProps {
  item: MenuItem;
  menu: MenuItem[];
  onAdd(variantId: string, quantity: number, selections: OrderSelections, notes: string): void;
  onClose(): void;
}

export function OrderItemDialog({ item, menu, onAdd, onClose }: OrderItemDialogProps) {
  const id = useId();
  const [variantId, setVariantId] = useState(item.variants.length === 1 ? item.variants[0].id : '');
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<OrderSelections>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const groups = resolveOrderGroups(item, menu);
  const premiumUnavailable = item.premiumExtraRequired && item.premiumExtraPaisa == null;
  let quote: ReturnType<typeof priceOrderSelection> | undefined;
  try { quote = priceOrderSelection(item, menu, variantId, selections); } catch { /* Selection is still being filled. */ }
  const total = quote && Number.isSafeInteger(quote.unitPricePaisa * quantity) ? quote.unitPricePaisa * quantity : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      onAdd(variantId, quantity, selections, notes);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not add this item. Please try again.');
    }
  }

  return (
    <Modal title={`Add ${item.name}`} onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        {item.description && <p className="order-contents">{item.description}</p>}
        <div className="select-field">
          <label htmlFor={`${id}-size`}>Size / portion</label>
          <select id={`${id}-size`} data-initial-focus value={variantId} required
            onChange={event => { setVariantId(event.target.value); setError(''); }}>
            <option value="" disabled>Choose a size</option>
            {item.variants.map(variant => <option key={variant.id} value={variant.id}>
              {variant.name} · {formatPkr(variant.pricePaisa)}
            </option>)}
          </select>
        </div>
        {groups.map(group => <fieldset className="order-choice-group" key={group.id}>
          <legend>{group.label}{group.quantity > 1 ? ` · choose ${group.quantity}` : ''}</legend>
          {group.options.length === 0 && <p className="form-error">Set up these choices in Manage menu before ordering.</p>}
          {Array.from({ length: group.quantity }, (_, index) => {
            const key = `${group.id}:${index}`;
            const label = group.quantity > 1 ? `${group.label} ${index + 1}` : group.label;
            return <div className="select-field" key={key}>
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <select id={`${id}-${key}`} value={selections[key] ?? ''} required
                onChange={event => { setSelections(previous => ({ ...previous, [key]: event.target.value })); setError(''); }}>
                <option value="" disabled>Choose {label.toLowerCase()}</option>
                {group.options.map(option => <option key={option.id} value={option.id}
                  disabled={!option.available || (option.premium && premiumUnavailable)}>
                  {option.name}{!option.available ? ' · unavailable' : option.premium ?
                    premiumUnavailable ? ' · premium extra not set' : ` · +${formatPkr(item.premiumExtraPaisa!)}` : ' · included'}
                </option>)}
              </select>
            </div>;
          })}
        </fieldset>)}
        {item.premiumExtraRequired && <p className="premium-note">
          {premiumUnavailable ? 'Premium extra is not set. Set it in Manage menu to offer premium pizza.' :
            `${formatPkr(item.premiumExtraPaisa!)} extra for each premium pizza, per bundle.`}
        </p>}
        {item.premiumExtraRequired && !groups.length && <p className="form-error">
          Set up order choices in Manage menu before ordering this item.
        </p>}
        <label>Special instructions<textarea value={notes} rows={2} maxLength={500}
          placeholder="e.g. No onions" onChange={event => setNotes(event.target.value)} /></label>
        <div className="order-quantity-row"><span>Quantity</span>
          <QuantityControl name={item.name} quantity={quantity} onChange={setQuantity} />
        </div>
        <div className="selection-total" aria-live="polite">
          {quote && total != null ? <>
            <div><span>Base price per {quote.variant.name === 'Bundle' ? 'bundle' : 'item'}</span><span>{formatPkr(quote.basePricePaisa)}</span></div>
            {quote.premiumPaisa > 0 && <div><span>Premium pizza extras</span><span>{formatPkr(quote.premiumPaisa)}</span></div>}
            <div className="selection-total-amount"><span>Total · {quantity} {quantity === 1 ? 'item' : 'items'}</span><strong>{formatPkr(total)}</strong></div>
          </> : <p>{quote ? 'This order amount is too large. Reduce the quantity.' : 'Choose your size and options to see the total.'}</p>}
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit">Add to order</button>
        </div>
      </form>
    </Modal>
  );
}
