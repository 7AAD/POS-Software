import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { StatusCard } from '../components/StatusCard';
import { useMenuSummary } from '../data/use-menu-summary';

export function Home() {
  const { summary, retry } = useMenuSummary();

  return (
    <div className="app-shell">
      <AppHeader />
      <main>
        <div className="page-heading">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>A fresh start<br />for your menu<span className="accent">.</span></h1>
          <p className="page-description">Your shop’s menu, kept together in one place.</p>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {summary.status === 'loading' && (
            <StatusCard title="Getting things ready" tone="loading">
              <p className="card-description" role="status">Opening your menu…</p>
            </StatusCard>
          )}
          {summary.status === 'error' && (
            <StatusCard title="Your menu could not be opened" tone="error">
              <p className="card-description" role="alert">
                Please try again. Your existing menu has not been reset.
              </p>
              <button type="button" onClick={retry}>Try again</button>
            </StatusCard>
          )}
          {summary.status === 'ready' && (
            <StatusCard title="Menu storage is ready">
              <p className="card-description">Saved on this device. Ready when you are.</p>
              <dl className="menu-counts">
                <div className="menu-stat">
                  <dt><span className="stat-icon"><AppIcon name="categories" /></span>Categories</dt>
                  <dd>{summary.categories}</dd>
                </div>
                <div className="menu-stat">
                  <dt><span className="stat-icon"><AppIcon name="items" /></span>Items</dt>
                  <dd>{summary.items}</dd>
                </div>
              </dl>
              {summary.items === 0 && (
                <div className="empty-menu">
                  <span className="empty-icon"><AppIcon name="utensils" /></span>
                  <h3>No menu items yet.</h3>
                  <p>Your items and prices will appear here once your menu is added.</p>
                </div>
              )}
              <p className="device-note">
                <AppIcon name="shield" />
                <span>Your menu stays on this device, even without internet.</span>
              </p>
            </StatusCard>
          )}
        </div>
      </main>
    </div>
  );
}
