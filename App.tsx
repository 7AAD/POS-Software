import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Order } from './pages/Order';
import { useOrderCart } from './data/use-order-cart';
import { BottomNavigation } from './components/BottomNavigation';
import { OpenOrders } from './pages/OpenOrders';
import { OrderSwitchDialog } from './components/OrderSwitchDialog';
import { useOrderNavigation } from './data/use-order-navigation';

export function App() {
  const cart = useOrderCart();
  const navigation = useOrderNavigation(cart);
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setHash(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const active = hash === '#menu' ? 'menu' : hash === '#order' ? 'order' : hash === '#orders' ? 'orders' : 'home';
  return <>
    {active === 'menu' ? <Menu /> : active === 'order' ? <Order cart={cart} onNew={navigation.requestNew} /> :
      active === 'orders' ? <OpenOrders cart={cart} navigation={navigation} /> : <Home />}
    <BottomNavigation active={active} />
    <OrderSwitchDialog cart={cart} navigation={navigation} />
  </>;
}
