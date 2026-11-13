import { SelectionTabs } from './SelectionTabs';

export function OrderViewTabs({ value }: { value: 'open' | 'paid' }) {
  return <SelectionTabs label="Order lists" className="order-type-tabs order-view-tabs" value={value}
    options={[{ value: 'open', label: 'Open orders' }, { value: 'paid', label: 'Paid orders' }]}
    onChange={next => { window.location.hash = next === 'paid' ? '#sales' : '#orders'; }} />;
}
