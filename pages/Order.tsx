import { useRef, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { MenuItemCard } from '../components/MenuItemCard';
import { Modal } from '../components/Modal';
import { OrderCart } from '../components/OrderCart';
import { OrderDetailsFields } from '../components/OrderDetailsFields';
import { OrderItemDialog } from '../components/OrderItemDialog';
import { SelectionTabs } from '../components/SelectionTabs';
import { StatusCard } from '../components/StatusCard';
import { filterMenu } from '../data/filter-menu';
import type { MenuItem } from '../data/menu-types';
import { formatPkr } from '../data/money';
import type { OrderDetails } from '../data/order-types';
import { useMenuEditor } from '../data/use-menu-editor';
import type { OrderCartState } from '../data/use-order-cart';

export function Order({ cart }: { cart: OrderCartState }) {
  const menu = useMenuEditor();
  const viewport = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const activeCategory = query.trim() ? 'all' : categoryId ?? menu.categories[0]?.id ?? 'all';
  const { visible, groups } = filterMenu(menu.items, menu.categories, query, activeCategory === 'all' ? '' : activeCategory);

  return (
    <div className="app-shell order-shell">
      <AppHeader compact action={<button type="button" className="icon-button secondary customer-button"
        aria-label="Customer and table details" onClick={() => setDetailsOpen(true)}><AppIcon name="customer" /></button>} />
      <main>
        <div className="order-title-row">
          <h1>New Order</h1><span className="draft-badge">Draft</span>
          <button type="button" className="icon-button search-toggle secondary" aria-label="Search menu"
            aria-expanded={searchOpen} aria-controls="order-search" onClick={() => {
              setSearchOpen(previous => !previous); setQuery('');
            }}><AppIcon name={searchOpen ? 'close' : 'search'} /></button>
        </div>
        <SelectionTabs label="Order type" className="order-type-tabs" value={cart.details.type}
          options={[{ value: 'dine-in', label: 'Dine-in' }, { value: 'takeaway', label: 'Takeaway' }, { value: 'delivery', label: 'Delivery' }]}
          onChange={type => cart.setDetails({ ...cart.details, type: type as OrderDetails['type'] })} />
        {searchOpen && <label id="order-search" className="order-search">Search items
          <input type="search" autoFocus placeholder="Search the whole menu" value={query}
            onChange={event => { setQuery(event.target.value); viewport.current?.scrollTo(0, 0); }} />
        </label>}
        <div className="order-layout">
          <div className="order-menu">
            {menu.loading && <StatusCard title="Opening your menu" tone="loading"><p role="status">Please wait…</p></StatusCard>}
            {menu.error && <StatusCard title="Your menu could not be opened" tone="error">
              <p role="alert">Please try again. Your menu has not been reset.</p>
              <a className="button-link" href="#home">Go home</a>
            </StatusCard>}
            {!menu.loading && !menu.error && <>
              <SelectionTabs label="Menu categories" className="category-tabs" value={activeCategory}
                options={[{ value: 'all', label: 'All' }, ...menu.categories.map(category => ({ value: category.id, label: category.name }))]}
                onChange={value => { setCategoryId(value); setQuery(''); viewport.current?.scrollTo(0, 0); }} />
              <p role="status" className="sr-only">{notice || `${visible.length} menu items`}</p>
              <div ref={viewport} className="order-menu-viewport" role="region" aria-label="Menu items" tabIndex={0}>
                {visible.length === 0 && <div className="empty-menu"><h2>No matching items</h2><p>Try another name or category.</p></div>}
                <div className="order-menu-groups">
                  {groups.map(group => <section key={group.category.id} aria-labelledby={`order-group-${group.category.id}`}>
                    <h2 id={`order-group-${group.category.id}`} className={activeCategory === 'all' ? 'order-category-heading' : 'sr-only'}>{group.category.name}</h2>
                    <div className="order-products">{group.items.map(item => <MenuItemCard item={item} key={item.id}
                      categoryName={group.category.name} onSelect={() => { setSelected(item); setNotice(''); }} />)}</div>
                  </section>)}
                </div>
              </div>
            </>}
          </div>
          <div className="order-summary">
            <OrderCart cart={cart} />
            <button type="button" className="order-review" disabled={cart.lines.length === 0} onClick={() => {
              const target = document.getElementById('current-order');
              target?.focus({ preventScroll: true });
              target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
            }}>Review order · {formatPkr(cart.totalPaisa)}</button>
            <p className="order-draft-note">Draft only · closing or reloading clears this order.</p>
          </div>
        </div>
      </main>
      {detailsOpen && <Modal title="Customer and table details" onClose={() => setDetailsOpen(false)}>
        <OrderDetailsFields value={cart.details} onChange={cart.setDetails} />
        <div className="form-actions details-actions"><button type="button" onClick={() => setDetailsOpen(false)}>Done</button></div>
      </Modal>}
      {selected && <OrderItemDialog item={selected} menu={menu.items} onClose={() => setSelected(null)}
        onAdd={(variantId, quantity, choices, notes) => {
          cart.add(selected, menu.items, variantId, quantity, choices, notes);
          setNotice(`${quantity} × ${selected.name} added to your order.`);
        }} />}
    </div>
  );
}
