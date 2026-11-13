interface SelectionTabsProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  className?: string;
  onChange(value: string): void;
}

export function SelectionTabs({ label, options, value, className = '', onChange }: SelectionTabsProps) {
  return (
    <div className={`selection-tabs ${className}`} role="group" aria-label={label}>
      {options.map(option => <button key={option.value} type="button"
        aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
        {option.label}
      </button>)}
    </div>
  );
}
