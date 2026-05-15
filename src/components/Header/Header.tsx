import { useWalletStore } from '@/store/useWalletStore';
import logoSvg from '@/assets/logo.svg';
import styles from './Header.module.css';

interface HeaderProps {
  pageTitle?: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const userInfo = useWalletStore((s) => s.userInfo);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoSection}>
          <img src={logoSvg} alt="Логотип Smart Wallet" className={styles.logoIcon} />
          <div className={styles.logoText}>
            <span className={`${styles.logoWord}`}>Smart</span>
            <span className={`${styles.logoWord}`}>Wallet</span>
          </div>
        </div>

        <div className={styles.userInfo}>
          <span className={styles.userName}>{userInfo.lastName}</span>
          <span className={styles.userName}>{userInfo.firstName}</span>
          <span className={styles.userName}>{userInfo.middleName}</span>
        </div>
      </header>
      {pageTitle && <h2 className={styles.pageTitle}>{pageTitle}</h2>}
    </>
  );
}