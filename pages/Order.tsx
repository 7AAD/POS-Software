import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { MenuFilters } from '../components/MenuFilters';
import { MenuItemCard } from '../components/MenuItemCard';
import { OrderCart } from '../components/OrderCart';
import { OrderItemDialog } from '../components/OrderItemDialog';
import { StatusCard } from '../components/StatusCard';
import { filterMenu } from '../data/filter-menu';
import type { MenuItem } from '../data/menu-types';
import { formatPkr } from '../data/money';
import { useMenuEditor } from '../data/use-menu-editor';
import type { OrderCartState } from '../data/use-order-cart';

export function Order({ cart }: { cart: OrderCartState }) {
  const menu = useMenuEditor();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [notice, setNotice] = useState('');
  const { visible, groups } = filterMenu(menu.items, menu.categories, query, categoryId);
  return (
    <div className="app-shell order-shell">
      <AppHeader />
      <main>
        <nav className="order-nav" aria-label="Workspace">
          <a className="back-link" href="#home"><AppIcon name="back" />Home</a>
          <a className="back-link" href="#menu"><AppIcon name="edit" />Manage menu</a>
        </nav>
        <div className="page-heading menu-heading">
          <p className="eyebrow">TAKE AN ORDER</p>
          <h1>What’s cooking<span className="accent">?</span></h1>
          <p className="page-description">Pick the food, make it their own, and keep the total in view.</p>
        </div>
        <div className="order-layout">
          <div className="order-menu">
            {menu.loading && <StatusCard title="Opening your menu" tone="loading"><p role="status">Please wait…</p></StatusCard>}
            {menu.error && <StatusCard title="Your menu could not be opened" tone="error">
              <p role="alert">Please try again. Your menu has not been reset.</p>
              <button type="button" onClick={() => { window.location.hash = '#home'; }}>Go home</button>
            </StatusCard>}
            {!menu.loading && !menu.error && <>
              <MenuFilters categories={menu.categories} query={query} categoryId={categoryId}
                onQueryChange={setQuery} onCategoryChange={setCategoryId} />
              <p className="menu-result-count">{visible.length} menu items · Choose an item to select its options</p>
              <p role="status" className={notice ? 'save-notice' : 'sr-only'} aria-live="polite">{notice}</p>
              {visible.length === 0 && <div className="empty-menu"><h2>No matching items</h2><p>Try another name or category.</p></div>}
              <div className="menu-groups">
                {groups.map(group => <section key={group.category.id} className="menu-group"
                  aria-labelledby={`order-group-${group.category.id}`}>
                  <div className="menu-group-heading"><h2 id={`order-group-${group.category.id}`}>{group.category.name}</h2>
                    <span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span></div>
                  <div className="menu-items">{group.items.map(item => <MenuItemCard item={item} key={item.id}
                    categoryName={group.category.name} onSelect={() => { setSelected(item); setNotice(''); }} />)}</div>
                </section>)}
              </div>
            </>}
          </div>
          <OrderCart cart={cart} />
        </div>
        <a className="mobile-cart-link" href="#current-order" onClick={event => {
          event.preventDefault();
          document.getElementById('current-order')?.focus({ preventScroll: true });
          document.getElementById('current-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}><span><AppIcon name="cart" />View order · {cart.quantity}</span><strong>{formatPkr(cart.totalPaisa)}</strong></a>
      </main>
      {selected && <OrderItemDialog item={selected} menu={menu.items} onClose={() => setSelected(null)}
        onAdd={(variantId, quantity, choices, notes) => {
          cart.add(selected, menu.items, variantId, quantity, choices, notes);
          setNotice(`${quantity} × ${selected.name} added to your order.`);
        }} />}
    </div>
  );
}
