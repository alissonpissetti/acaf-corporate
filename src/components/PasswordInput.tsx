import { useId, useState } from 'react';

function EyeIcon({ hidden = false }: { hidden?: boolean }) {
  if (hidden) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.269 8.924 11.298 11.298 0 0 1-4.52 6.493" />
        <path d="M14.084 14.158a3 3 0 1 1-4.009-4.009" />
        <path d="M17.479 17.499a10.89 10.89 0 0 1-5.493 2.05 10.745 10.745 0 0 1-9.183-4.918" />
        <path d="m2 2 20 20" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export type PasswordInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function PasswordInput({
  id: idProp,
  value,
  onChange,
  onBlur,
  disabled,
  autoComplete,
  placeholder,
  required,
  minLength,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: PasswordInputProps) {
  const uid = useId();
  const id = idProp ?? uid;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-input-wrap${className ? ` ${className}` : ''}`}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}
