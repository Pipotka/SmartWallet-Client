import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './Header.module.css';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title }: HeaderProps) {
  const navigate = useNavigate();
  const userInfo = useWalletStore((s) => s.userInfo);

  return (
    <header className={styles.header}>
      {showBackButton ? (
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          <svg
            className={styles.backIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <h1 className={styles.logo}>Smart Wallet</h1>
      )}

      {title && (
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{title}</h2>
        </div>
      )}

      <div className={styles.userInfo}>
        <span className={styles.userName}>{userInfo.lastName}</span>
        <span className={styles.userName}>{userInfo.firstName}</span>
        <span className={styles.userName}>{userInfo.middleName}</span>
      </div>
    </header>
  );
}