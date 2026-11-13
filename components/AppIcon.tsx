const paths = {
  utensils: 'M4 3v7m3-7v18m3-18v7M4 7h6M19 3v18M19 3c-5 3-5 9 0 9',
  check: 'M5 12l4 4L19 6',
  categories: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  items: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6',
  alert: 'M12 8v5m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};

interface AppIconProps {
  name: keyof typeof paths;
  className?: string;
}

export function AppIcon({ name, className }: AppIconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
