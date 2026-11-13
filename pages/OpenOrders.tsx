import { AppHeader } from '../components/AppHeader';
import { AppIcon } from '../components/AppIcon';
import { StatusCard } from '../components/StatusCard';
import { formatPkr } from '../data/money';
import { useOpenOrders } from '../data/use-open-orders';
import type { OrderCartState } from '../data/use-order-cart';
import type { OrderNavigation } from '../data/use-order-navigation';

const typeNames = { 'dine-in': 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };

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
            {saved.orders.map(order => {
              const quantity = order.lines.reduce((count, line) => count + line.quantity, 0);
              return <article className="saved-order-card" key={order.id} aria-label={`Order #${order.number}`}>
              <div className="saved-order-heading"><h2>Order #{order.number}</h2><strong>{formatPkr(order.totalPaisa)}</strong></div>
              <p className="saved-order-type">{typeNames[order.details.type]}
                {order.details.type === 'dine-in' && order.details.table && ` · Table ${order.details.table}`}
                {' · '}{quantity} {quantity === 1 ? 'item' : 'items'}</p>
              {order.details.customerName && <p className="saved-order-customer">{order.details.customerName}</p>}
              {order.details.customerPhone && <p className="saved-order-phone">{order.details.customerPhone}</p>}
              <p className="saved-order-preview">{order.lines.map(line => `${line.quantity} × ${line.itemName}`).join(', ')}</p>
              <p className="saved-order-time">Saved {new Date(order.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
              {cart.activeOrder?.id === order.id && <p className="saved-order-editing">
                {cart.activeOrder.revision !== order.revision ? 'Saved copy updated · reopen to review' :
                  cart.dirty ? 'Currently editing · unsaved changes' : 'Currently open in POS'}</p>}
              <button type="button" className="button-link" disabled={busy} aria-label={`Open order #${order.number}`}
                onClick={() => navigation.requestOpen(order.id, order.revision)}>
                {cart.activeOrder?.id === order.id && cart.activeOrder.revision === order.revision ? 'Continue editing' : 'Open order'}<AppIcon name="back" />
              </button>
            </article>;
            })}
          </div>
        </>}
      </main>
    </div>
  );
}
