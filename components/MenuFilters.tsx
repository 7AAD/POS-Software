import { useId } from 'react';
import type { Category } from '../data/menu-types';

interface MenuFiltersProps {
  categories: Category[];
  query: string;
  categoryId: string;
  onQueryChange(value: string): void;
  onCategoryChange(value: string): void;
}

export function MenuFilters({ categories, query, categoryId, onQueryChange, onCategoryChange }: MenuFiltersProps) {
  const id = useId();
  return (
    <div className="menu-filters">
      <label>Search items<input type="search" placeholder="Search your menu" value={query}
        onChange={event => onQueryChange(event.target.value)} /></label>
      <div className="select-field"><label htmlFor={`${id}-category`}>Category</label>
        <select id={`${id}-category`} value={categoryId} onChange={event => onCategoryChange(event.target.value)}>
          <option value="">All categories</option>
          {categories.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </div>
    </div>
  );
}
