import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'neutral' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  icon,
  fullWidth = false,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}

export function SaveIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
      <path d="M13.854 2.146a.5.5 0 0 1 0 .708l-8 8a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.793l7.646-7.647a.5.5 0 0 1 .708 0z" />
      <path d="M14 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-9A1.5 1.5 0 0 1 3.5 4H7a.5.5 0 0 1 0 1H3.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H9a.5.5 0 0 1 0-1h3.5A1.5 1.5 0 0 1 14 5.5z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}