import styles from './InputField.module.css';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'password' | 'email';
  name?: string;
  error?: boolean;
  errorText?: string;
  onBlur?: () => void;
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
  error,
  errorText,
  onBlur,
}: InputFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        name={name}
        onBlur={onBlur}
      />
      {errorText && <span className={styles.errorText}>{errorText}</span>}
    </div>
  );
}
