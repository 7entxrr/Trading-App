'use client';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingRow({ label, description, checked, onChange, disabled }: SettingRowProps) {
  return (
    <div className="rows__item">
      <div className="rows__label" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span style={{ color: 'var(--text)', fontWeight: 550 }}>{label}</span>
        {description && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</span>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
