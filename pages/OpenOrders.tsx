import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { StatusCard } from '../components/StatusCard';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { OrderViewTabs } from '../components/OrderViewTabs';
import { useOpenOrders } from '../data/use-open-orders';
import type { OrderCartState } from '../data/use-order-cart';
import type { OrderNavigation } from '../data/use-order-navigation';

export function OpenOrders({ cart, navigation }: { cart: OrderCartState; navigation: OrderNavigation }) {
  const saved = useOpenOrders();
  const busy = cart.busy || navigation.working;
  return (
    <div className="app-shell open-orders-shell">
      <AppHeader compact />
      <main>
        <div className="page-heading menu-heading">
          <p className="eyebrow">SAVED ON THIS DEVICE</p><h1>Open orders</h1>
          <p className="page-description">Pick up where you left off, even after restarting the app.</p>
        </div>
        <OrderViewTabs value="open" />
        <div className="menu-toolbar">
          <button type="button" disabled={busy} onClick={navigation.requestNew}><AppIcon name="plus" />New order</button>
          <button type="button" className="secondary" disabled={saved.loading || busy} onClick={saved.refresh}>Refresh</button>
        </div>
        {saved.loading && <StatusCard title="Opening saved orders" tone="loading"><p role="status">Please wait…</p></StatusCard>}
        {saved.error && <StatusCard title="Orders could not be opened" tone="error">
          <p role="alert">Please try again. Your saved orders have not been reset.</p>
          <button type="button" disabled={busy} onClick={saved.refresh}>Try again</button>
        </StatusCard>}
        {!saved.loading && !saved.error && <>
          <p className="menu-result-count">{saved.orders.length} open {saved.orders.length === 1 ? 'order' : 'orders'}</p>
          {saved.orders.length === 0 && <div className="empty-menu"><h2>No saved orders yet</h2>
            <p>Add items in POS, then tap Save order.</p></div>}
          <div className="saved-order-list">
            {saved.orders.map(order => <OrderSummaryCard key={order.id} number={order.number}
              totalPaisa={order.totalPaisa} details={order.details} lines={order.lines} timestamp={order.updatedAt}
              note={cart.activeOrder?.id === order.id ? cart.activeOrder.revision !== order.revision ?
                'Saved copy updated · reopen to review' : cart.dirty ? 'Currently editing · unsaved changes' : 'Currently open in POS' : undefined}>
              <button type="button" className="button-link" disabled={busy} aria-label={`Open order #${order.number}`}
                onClick={() => navigation.requestOpen(order.id, order.revision)}>
                {cart.activeOrder?.id === order.id && cart.activeOrder.revision === order.revision ? 'Continue editing' : 'Open order'}<AppIcon name="back" />
              </button>
            </OrderSummaryCard>)}
          </div>
        </>}
      </main>
    </div>
  );
}
