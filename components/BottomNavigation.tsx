import { AppIcon } from './AppIcon';

const links = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'order', label: 'POS', icon: 'cart' },
  { id: 'orders', label: 'Orders', icon: 'clock' },
  { id: 'menu', label: 'Menu', icon: 'items' },
] as const;

export function BottomNavigation({ active }: { active: 'home' | 'order' | 'orders' | 'menu' }) {
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {links.map(link => <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? 'page' : undefined}>
        <AppIcon name={link.icon} /><span>{link.label}</span>
      </a>)}
    </nav>
  );
}
