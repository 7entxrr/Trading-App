'use client';

interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface ChipsProps<T extends string> {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/** Horizontally scrollable filter row — the mobile answer to a filter sidebar. */
export function Chips<T extends string>({ options, value, onChange, ariaLabel }: ChipsProps<T>) {
  return (
    <div className="chips" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="chip"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className="chip__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
