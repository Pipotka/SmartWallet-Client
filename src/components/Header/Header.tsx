import { useUser } from '@/api/queries/user';
import logoSvg from '@/assets/logo.svg';
import styles from './Header.module.css';

interface HeaderProps {
  pageTitle?: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const { data: user } = useUser();

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
          <span className={styles.userName}>{user?.lastName ?? ''}</span>
          <span className={styles.userName}>{user?.firstName ?? ''}</span>
          <span className={styles.userName}>{user?.patronymic ?? ''}</span>
        </div>
      </header>
      {pageTitle && <h2 className={styles.pageTitle}>{pageTitle}</h2>}
    </>
  );
}
