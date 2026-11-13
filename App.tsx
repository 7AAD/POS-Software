import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Order } from './pages/Order';
import { useOrderCart } from './data/use-order-cart';
import { BottomNavigation } from './components/BottomNavigation';
import { OpenOrders } from './pages/OpenOrders';
import { OrderSwitchDialog } from './components/OrderSwitchDialog';
import { useOrderNavigation } from './data/use-order-navigation';
import { Checkout } from './pages/Checkout';
import { PaidOrders } from './pages/PaidOrders';
import { Sale } from './pages/Sale';

export function App() {
  const cart = useOrderCart();
  const navigation = useOrderNavigation(cart);
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setHash(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const route = hash.split('/')[0];
  let recordId = '';
  try { recordId = decodeURIComponent(hash.slice(route.length + 1)); } catch { /* The page shows a missing-record state. */ }
  const active = route === '#menu' ? 'menu' : route === '#order' ? 'order' : route === '#checkout' ? 'checkout' :
    route === '#orders' ? 'orders' : route === '#sales' ? 'sales' : route === '#sale' ? 'sale' : 'home';
  return <>
    {active === 'menu' ? <Menu /> : active === 'order' ? <Order cart={cart} onNew={navigation.requestNew} /> :
      active === 'orders' ? <OpenOrders cart={cart} navigation={navigation} /> : active === 'sales' ? <PaidOrders /> :
        active === 'checkout' ? <Checkout key={recordId} orderId={recordId} cart={cart} onNew={navigation.requestNew} /> :
          active === 'sale' ? <Sale key={recordId} saleId={recordId} onNew={navigation.requestNew} /> : <Home />}
    <BottomNavigation busy={cart.busy} active={active === 'checkout' ? 'order' : active === 'sale' || active === 'sales' ? 'orders' : active} />
    <OrderSwitchDialog cart={cart} navigation={navigation} />
  </>;
}
