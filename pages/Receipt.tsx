import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { ReceiptDocument } from '../components/ReceiptDocument';
import { StatusCard } from '../components/StatusCard';
import { useSales } from '../data/use-sales';

export function Receipt({ saleId }: { saleId: string }) {
  const state = useSales(saleId);
  return <div className="app-shell receipt-shell">
    <AppHeader compact />
    <main>
      <a className="back-link" href={`#sale/${encodeURIComponent(saleId)}`}><AppIcon name="back" />Back to sale</a>
      <div className="checkout-heading"><h1>Receipt</h1><p>From the recorded payment.</p></div>
      {state.loading && <StatusCard title="Opening receipt" tone="loading"><p role="status">Please wait…</p></StatusCard>}
      {state.error && <StatusCard title="Receipt could not be opened" tone="error">
        <p role="alert">Please try again. The stored sale has not been changed.</p>
        <button type="button" onClick={state.retry}>Try again</button>
      </StatusCard>}
      {!state.loading && !state.error && state.sales[0] && <ReceiptDocument sale={state.sales[0]} />}
      <a className="button-link secondary receipt-back" href="#sales">Paid orders</a>
    </main>
  </div>;
}
