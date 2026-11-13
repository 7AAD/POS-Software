import { useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { StatusCard } from '../components/StatusCard';
import { CategoryEditor } from '../components/CategoryEditor';
import { ItemEditor } from '../components/ItemEditor';
import { MenuItemCard } from '../components/MenuItemCard';
import { MenuFilters } from '../components/MenuFilters';
import { filterMenu } from '../data/filter-menu';
import { useMenuEditor } from '../data/use-menu-editor';
import type { MenuItem, MenuItemInput } from '../data/menu-types';

export function Menu() {
  const menu = useMenuEditor();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editor, setEditor] = useState<{ item: MenuItem | null } | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const { visible, groups } = filterMenu(menu.items, menu.categories, query, category);

  async function saveItem(input: MenuItemInput) {
    await menu.saveItem(input);
    setNotice(`${input.name.trim()} saved on this device.`);
  }

  return (
    <div className="app-shell menu-shell">
      <AppHeader />
      <main>
        <a className="back-link" href="#home"><AppIcon name="back" />Home</a>
        <div className="page-heading menu-heading">
          <p className="eyebrow">YOUR MENU</p>
          <h1>Make it yours<span className="accent">.</span></h1>
          <p className="page-description">Edit your items, sizes, and prices. Changes stay on this device.</p>
        </div>
        {menu.loading && <StatusCard title="Opening your menu" tone="loading"><p role="status">Please wait…</p></StatusCard>}
        {menu.error && <StatusCard title="Your menu could not be opened" tone="error">
          <p role="alert">Please try again. Your menu has not been reset.</p>
          <button type="button" onClick={() => window.location.reload()}>Try again</button>
        </StatusCard>}
        {!menu.loading && !menu.error && <>
          <div className="menu-toolbar">
            <a className="button-link secondary" href="#order"><AppIcon name="cart" />Take an order</a>
            <button type="button" onClick={() => { setEditor({ item: null }); setNotice(''); }}
              disabled={menu.categories.length === 0}><AppIcon name="plus" />Add item</button>
            <button type="button" className="secondary" onClick={() => setCategoriesOpen(true)}>Categories</button>
          </div>
          <MenuFilters categories={menu.categories} query={query} categoryId={category}
            onQueryChange={setQuery} onCategoryChange={setCategory} />
          <p className="menu-result-count">{visible.length} of {menu.items.length} items · {menu.categories.length} categories</p>
          {notice && <p role="status" className="save-notice">{notice}</p>}
          {visible.length === 0 && <div className="empty-menu">
            <h2>{menu.items.length ? 'No matching items' : 'No menu items yet'}</h2>
            <p>{menu.items.length ? 'Try another name or category.' : 'Add a category, then add your first item.'}</p>
          </div>}
          <div className="menu-groups">
            {groups.map(group => <section key={group.category.id} className="menu-group"
              aria-labelledby={`group-${group.category.id}`}>
              <div className="menu-group-heading">
                <h2 id={`group-${group.category.id}`}>{group.category.name}</h2>
                <span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="menu-items">
                {group.items.map(item => <MenuItemCard key={item.id} item={item}
                  categoryName={group.category.name}
                  onEdit={() => { setEditor({ item }); setNotice(''); }} />)}
              </div>
            </section>)}
          </div>
          <p className="menu-footnote">Deal prices are the listed base prices. Premium extras can be set in the item editor.</p>
        </>}
      </main>
      {editor && <ItemEditor item={editor.item} categories={menu.categories}
        menuItems={menu.items}
        defaultCategoryId={category || menu.categories[0]?.id || ''} onSave={saveItem} onClose={() => setEditor(null)} />}
      {categoriesOpen && <CategoryEditor categories={menu.categories} onSave={menu.saveCategory}
        onClose={() => setCategoriesOpen(false)} />}
    </div>
  );
}
