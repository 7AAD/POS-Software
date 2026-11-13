import { useId, useRef, useState, type FormEvent } from 'react';
import type { Category, MenuItem, MenuItemInput } from '../data/menu-types';
import { menuErrorMessage } from '../data/menu-error';
import { parsePkr, priceForInput } from '../data/money';
import { Modal } from './Modal';
import { AppIcon } from './AppIcon';
import { OrderOptionsFields } from './OrderOptionsFields';
import type { OrderOptions } from '../data/order-option-types';

interface ItemEditorProps {
  item: MenuItem | null;
  categories: Category[];
  defaultCategoryId: string;
  menuItems: MenuItem[];
  onSave(input: MenuItemInput): Promise<void>;
  onClose(): void;
}

export function ItemEditor({ item, categories, defaultCategoryId, menuItems, onSave, onClose }: ItemEditorProps) {
  const formId = useId();
  const [name, setName] = useState(item?.name ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? defaultCategoryId);
  const [description, setDescription] = useState(item?.description ?? '');
  const [active, setActive] = useState(item?.active ?? true);
  const [premium, setPremium] = useState(item?.premiumExtraRequired ?? false);
  const [extra, setExtra] = useState(item?.premiumExtraPaisa == null ? '' : priceForInput(item.premiumExtraPaisa));
  const [orderOptions, setOrderOptions] = useState<OrderOptions>(item?.orderOptions ?? { groups: [] });
  const nextKey = useRef(0);
  const [variants, setVariants] = useState(() => item?.variants.map(variant => ({
    id: variant.id as string | undefined, key: variant.id, name: variant.name, price: priceForInput(variant.pricePaisa),
  })) ?? [{ id: undefined, key: 'initial', name: 'Regular', price: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateVariant(index: number, field: 'name' | 'price', value: string) {
    setVariants(previous => previous.map((variant, current) => current === index ? { ...variant, [field]: value } : variant));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      await onSave({
        id: item?.id, name, categoryId, description, active,
        premiumExtraRequired: premium,
        premiumExtraPaisa: premium && extra.trim() ? parsePkr(extra) : null,
        orderOptions: orderOptions.groups.length ? orderOptions : null,
        variants: variants.map(variant => ({ id: variant.id, name: variant.name, pricePaisa: parsePkr(variant.price) })),
      });
      setSaving(false); onClose();
    } catch (failure) {
      setError(menuErrorMessage(failure)); setSaving(false);
    }
  }

  return (
    <Modal title={item ? 'Edit menu item' : 'Add menu item'} busy={saving} onClose={onClose}>
      <form onSubmit={submit} className="editor-form">
        <fieldset disabled={saving}>
          <label>Item name<input data-initial-focus value={name} maxLength={100} required
            onChange={event => setName(event.target.value)} /></label>
          <div className="select-field"><label htmlFor={`${formId}-category`}>Category</label>
            <select id={`${formId}-category`} value={categoryId} required onChange={event => setCategoryId(event.target.value)}>
            <option value="" disabled>Choose a category</option>
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="select-field"><label htmlFor={`${formId}-details`}>Details / deal contents</label>
            <textarea id={`${formId}-details`} value={description} maxLength={1000} rows={3}
              onChange={event => setDescription(event.target.value)} />
          </div>
          <label className="check-label"><input type="checkbox" checked={active}
            onChange={event => setActive(event.target.checked)} />Available</label>
          <div className="field-section">
            <h3>Sizes and prices</h3>
            <p className="field-help">Use Regular for an item with one price.</p>
            {variants.map((variant, index) => (
              <div className="variant-row" key={variant.key}>
                <label>Size / portion<input aria-label={`Size ${index + 1}`} value={variant.name}
                  required maxLength={100} onChange={event => updateVariant(index, 'name', event.target.value)} /></label>
                <label>Price (Rs.)<input aria-label={`Price for ${variant.name || 'new size'}`} type="number"
                  inputMode="decimal" min="0" step="0.01" required value={variant.price}
                  onChange={event => updateVariant(index, 'price', event.target.value)} /></label>
                <button type="button" className="icon-button secondary" disabled={variants.length === 1}
                  aria-label={`Remove ${variant.name || 'new'} size`}
                  onClick={() => setVariants(previous => previous.filter((_, current) => current !== index))}>
                  <AppIcon name="remove" />
                </button>
              </div>
            ))}
            <button type="button" className="secondary" onClick={() => setVariants(previous => [...previous,
              { id: undefined, key: `new-${nextKey.current++}`, name: '', price: '' },
            ])}><AppIcon name="plus" />Add size</button>
          </div>
          <div className="field-section">
            <label className="check-label"><input type="checkbox" checked={premium}
              onChange={event => setPremium(event.target.checked)} />Premium option costs extra</label>
            {premium && <div>
              <label>Premium extra (Rs.)<input type="number" min="0.01" step="0.01"
                inputMode="decimal" value={extra} aria-describedby={`${formId}-premium-help`}
                onChange={event => setExtra(event.target.value)} /></label>
              <p className="field-help" id={`${formId}-premium-help`}>Charged for each premium pizza in a deal.
                Leave blank until confirmed; premium selections cannot be ordered without it.</p>
            </div>}
          </div>
          <OrderOptionsFields value={orderOptions} menuItems={menuItems} onChange={setOrderOptions} />
        </fieldset>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save item'}</button>
        </div>
      </form>
    </Modal>
  );
}
