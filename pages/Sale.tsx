import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { SaleSummary } from '../components/SaleSummary';
import { StatusCard } from '../components/StatusCard';
import { useSales } from '../data/use-sales';

export function Sale({ saleId, onNew }: { saleId: string; onNew(): void }) {
  const state = useSales(saleId);
  return <div className="app-shell checkout-shell">
    <AppHeader compact />
    <main>
      <a className="back-link" href="#sales"><AppIcon name="back" />Paid orders</a>
      <div className="checkout-heading"><h1>Completed sale</h1></div>
      {state.loading && <StatusCard title="Opening completed sale" tone="loading"><p role="status">Please wait…</p></StatusCard>}
      {state.error && <StatusCard title="Sale could not be opened" tone="error">
        <p role="alert">Please try again. The stored payment has not been changed.</p><button type="button" onClick={state.retry}>Try again</button>
      </StatusCard>}
      {!state.loading && !state.error && state.sales[0] && <SaleSummary sale={state.sales[0]} onNew={onNew} />}
    </main>
  </div>;
}
