import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';

export function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => setHash(window.location.hash);
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  return hash === '#menu' ? <Menu /> : <Home />;
}
