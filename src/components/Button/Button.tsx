import styles from './Button.module.css';
import fileIcon from '@/assets/file-icon.svg';
import crossIcon from '@/assets/cross-icon.svg';
import trashIcon from '@/assets/trash.svg';

type ButtonVariant = 'primary' | 'neutral' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  icon,
  fullWidth = false,
  type = 'button',
  disabled = false,
  className,
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
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
  return <img src={fileIcon} alt="" />;
}

export function CloseIcon() {
  return <img src={crossIcon} alt="" />;
}

export function TrashIcon() {
  return <img src={trashIcon} alt="" />;
}