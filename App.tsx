import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Order } from './pages/Order';
import { useOrderCart } from './data/use-order-cart';

export function App() {
  const cart = useOrderCart();
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setHash(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  if (hash === '#menu') return <Menu />;
  if (hash === '#order') return <Order cart={cart} />;
  return <Home />;
}
