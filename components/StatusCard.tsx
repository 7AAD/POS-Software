import type { ReactNode } from 'react';
import { AppIcon } from './AppIcon';

interface StatusCardProps {
  title: string;
  children: ReactNode;
  tone?: 'ready' | 'loading' | 'error';
}

export function StatusCard({ title, children, tone = 'ready' }: StatusCardProps) {
  const icon = tone === 'error' ? 'alert' : tone === 'loading' ? 'clock' : 'check';

  return (
    <section className={`status-card status-card--${tone}`}>
      <div className="card-heading">
        <span className="status-icon"><AppIcon name={icon} /></span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
