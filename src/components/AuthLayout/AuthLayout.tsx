import logoSvg from '@/assets/logo.svg';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrapper}>
          <img src={logoSvg} alt="Smart Wallet" className={styles.icon} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
