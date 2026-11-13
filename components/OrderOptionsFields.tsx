import { useId } from 'react';
import type { MenuItem } from '../data/menu-types';
import type { OrderChoiceGroup, OrderOptions } from '../data/order-option-types';
import { AppIcon } from './AppIcon';

interface OrderOptionsFieldsProps {
  value: OrderOptions;
  menuItems: MenuItem[];
  onChange(value: OrderOptions): void;
}

export function OrderOptionsFields({ value, menuItems, onChange }: OrderOptionsFieldsProps) {
  const id = useId();
  function updateGroup(groupId: string, change: Partial<OrderChoiceGroup>) {
    onChange({ groups: value.groups.map(group => group.id === groupId ? { ...group, ...change } : group) });
  }

  return (
    <details className="field-section order-options-editor">
      <summary>Order choices ({value.groups.length} groups)</summary>
      <p className="field-help">Choose flavours or drink sizes when taking an order. Each Premium choice
        adds the extra once per pizza. Update choices when you change deal contents.</p>
      {value.groups.map((group, groupIndex) => <div className="choice-group-editor" key={group.id}>
        <div className="choice-group-title">
          <h3>Choice group {groupIndex + 1}</h3>
          <button type="button" className="icon-button secondary" aria-label={`Remove choice group ${groupIndex + 1}`}
            onClick={() => onChange({ groups: value.groups.filter(entry => entry.id !== group.id) })}>
            <AppIcon name="remove" /></button>
        </div>
        <label>Group label<input aria-label={`Choice group ${groupIndex + 1} label`} value={group.label}
          required maxLength={100} placeholder="Small pizza" onChange={event => updateGroup(group.id, { label: event.target.value })} /></label>
        <label>Choices needed per bundle<input type="number" min="1" max="10" step="1"
          aria-label={`Choice group ${groupIndex + 1} quantity`} value={group.quantity}
          onChange={event => updateGroup(group.id, { quantity: Number(event.target.value) })} /></label>
        {group.options.map((option, optionIndex) => {
          const prefix = `Group ${groupIndex + 1} option ${optionIndex + 1}`;
          const changeOption = (change: Partial<typeof option>) => updateGroup(group.id, {
            options: group.options.map(entry => entry.id === option.id ? { ...entry, ...change } : entry),
          });
          return <div className="choice-option-editor" key={option.id}>
            <div className="select-field">
              <label htmlFor={`${id}-${groupIndex}-${optionIndex}`}>{prefix}: linked menu size</label>
              <select id={`${id}-${groupIndex}-${optionIndex}`} value={option.menuVariantId ?? ''}
                onChange={event => {
                  const linked = menuItems.find(item => item.variants.some(variant => variant.id === event.target.value));
                  changeOption({ menuVariantId: event.target.value || undefined, name: linked?.name ?? option.name });
                }}>
                <option value="">Custom choice</option>
                {option.menuVariantId && !menuItems.some(item => item.variants.some(variant => variant.id === option.menuVariantId)) &&
                  <option value={option.menuVariantId}>Unavailable menu size</option>}
                {menuItems.map(item => <optgroup key={item.id} label={item.name}>
                  {item.variants.map(variant => <option key={variant.id} value={variant.id}>
                    {item.name} · {variant.name}{item.active ? '' : ' (unavailable)'}
                  </option>)}
                </optgroup>)}
              </select>
            </div>
            <label>Choice name<input aria-label={`${prefix} name`} required maxLength={100}
              value={option.name} readOnly={Boolean(option.menuVariantId)}
              onChange={event => changeOption({ name: event.target.value })} /></label>
            <div className="choice-option-actions">
              <label className="check-label"><input type="checkbox" checked={option.premium}
                aria-label={`${prefix} premium`} onChange={event => changeOption({ premium: event.target.checked })} />Premium</label>
              <button type="button" className="icon-button secondary" aria-label={`Remove ${prefix.toLowerCase()}`}
                onClick={() => updateGroup(group.id, { options: group.options.filter(entry => entry.id !== option.id) })}>
                <AppIcon name="remove" /></button>
            </div>
          </div>;
        })}
        {group.options.length === 0 && <p className="field-help">Add options before offering this item for orders.</p>}
        <button type="button" className="secondary" disabled={group.options.length >= 20}
          onClick={() => updateGroup(group.id, { options: [...group.options,
            { id: crypto.randomUUID(), name: '', premium: false }] })}><AppIcon name="plus" />Add choice</button>
      </div>)}
      <button type="button" className="secondary" disabled={value.groups.length >= 10}
        onClick={() => onChange({ groups: [...value.groups, {
          id: crypto.randomUUID(), label: '', quantity: 1, options: [],
        }] })}><AppIcon name="plus" />Add choice group</button>
    </details>
  );
}
