import { AppIcon } from './AppIcon';

export function AppHeader() {
  return (
    <header className="app-header">
      <span className="brand-icon"><AppIcon name="utensils" /></span>
      <div>
        <p className="brand-name">MASTER FOODS</p>
        <p className="brand-subtitle">Mobile Restaurant POS</p>
      </div>
    </header>
  );
}
