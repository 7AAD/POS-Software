import { AppHeader } from '../components/AppHeader';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { OrderViewTabs } from '../components/OrderViewTabs';
import { StatusCard } from '../components/StatusCard';
import { paymentMethods } from '../data/payment-types';
import { useSales } from '../data/use-sales';

export function PaidOrders() {
  const state = useSales();
  return <div className="app-shell open-orders-shell">
    <AppHeader compact />
    <main>
      <div className="page-heading menu-heading"><p className="eyebrow">COMPLETED SALES</p><h1>Paid orders</h1>
        <p className="page-description">Recorded payments and the order details kept with them.</p></div>
      <OrderViewTabs value="paid" />
      {state.loading && <StatusCard title="Opening paid orders" tone="loading"><p role="status">Please wait…</p></StatusCard>}
      {state.error && <StatusCard title="Paid orders could not be opened" tone="error">
        <p role="alert">Please try again. The stored payments have not been changed.</p><button type="button" onClick={state.retry}>Try again</button>
      </StatusCard>}
      {!state.loading && !state.error && <>
        <p className="menu-result-count">{state.sales.length} paid {state.sales.length === 1 ? 'order' : 'orders'}</p>
        {state.sales.length === 0 && <div className="empty-menu"><h2>No paid orders yet</h2><p>Record a payment from checkout to keep its completed sale here.</p></div>}
        <div className="saved-order-list">{state.sales.map(sale => <OrderSummaryCard key={sale.id} number={sale.orderNumber}
          totalPaisa={sale.totalPaisa} details={sale.details} lines={sale.lines} timestamp={sale.paidAt}
          note={<span className="paid-indicator">Paid · {paymentMethods.find(method => method.value === sale.method)?.label}</span>}>
          <a className="button-link" href={`#sale/${encodeURIComponent(sale.id)}`} aria-label={`View sale for order #${sale.orderNumber}`}>View sale</a>
        </OrderSummaryCard>)}</div>
      </>}
    </main>
  </div>;
}
