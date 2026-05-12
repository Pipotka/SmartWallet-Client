import styles from './InputField.module.css';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  name?: string;
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
}: InputFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        name={name}
      />
    </div>
  );
}