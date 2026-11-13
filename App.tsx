import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Order } from './pages/Order';
import { useOrderCart } from './data/use-order-cart';
import { BottomNavigation } from './components/BottomNavigation';

export function App() {
  const cart = useOrderCart();
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setHash(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const active = hash === '#menu' ? 'menu' : hash === '#order' ? 'order' : 'home';
  return <>
    {active === 'menu' ? <Menu /> : active === 'order' ? <Order cart={cart} /> : <Home />}
    <BottomNavigation active={active} />
  </>;
}
