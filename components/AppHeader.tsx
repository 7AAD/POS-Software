import type { ReactNode } from 'react';
import { AppIcon } from './AppIcon';

export function AppHeader({ compact = false, action }: { compact?: boolean; action?: ReactNode }) {
  return (
    <header className={`app-header${compact ? ' compact-header' : ''}`}>
      <span className="brand-icon"><AppIcon name="utensils" /></span>
      <div>
        <p className="brand-name">MASTER FOODS</p>
        <p className="brand-subtitle">Mobile Restaurant POS</p>
      </div>
      {action && <div className="header-action">{action}</div>}
    </header>
  );
}
