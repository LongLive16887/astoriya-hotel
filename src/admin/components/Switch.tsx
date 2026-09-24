interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Hide the text label visually (it is still announced). */
  hideLabel?: boolean
  disabled?: boolean
}

export function Switch({ checked, onChange, label, hideLabel, disabled }: SwitchProps) {
  return (
    <label className={`a-switch ${disabled ? 'is-disabled' : ''}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="a-switch__track" aria-hidden="true" />
      <span className={hideLabel ? 'visually-hidden' : 'a-switch__label'}>{label}</span>
    </label>
  )
}
