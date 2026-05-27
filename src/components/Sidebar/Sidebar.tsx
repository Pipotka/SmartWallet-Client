import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useLogout } from '@/api/queries/user';
import type { NavTab } from '@/types';
import logoSvg from '@/assets/logo.svg';
import categoriesIcon from '@/assets/categories-icon.svg';
import analyzeIcon from '@/assets/analyze-icon.svg';
import transactionIcon from '@/assets/transaction-icon.svg';
import profileIcon from '@/assets/profile-icon.svg';
import styles from './Sidebar.module.css';

interface NavItem {
  key: NavTab;
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Категории', path: '/', icon: categoriesIcon },
  { key: 'analytics', label: 'Аналитика', path: '/analytics', icon: analyzeIcon },
  { key: 'transactions', label: 'Транзакций', path: '/transactions', icon: transactionIcon },
  { key: 'profile', label: 'Профиль', path: '/profile', icon: profileIcon },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <img src={logoSvg} alt="Smart Wallet" className={styles.logoIcon} />
        <div className={styles.logoText}>
          <span className={styles.logoWord}>Smart</span>
          <span className={styles.logoWord}>Wallet</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = item.key === 'profile'
            ? location.pathname.startsWith('/profile')
            : location.pathname === item.path;
          return (
            <button
              key={item.key}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => navigate(item.path)}
              data-label={item.label}
              aria-label={item.label}
            >
              <span className={styles.navIcon}>
                <img src={item.icon} alt="" />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.userInfo}>
        <span className={styles.userName}>{user?.lastName ?? ''}</span>
        <span className={styles.userName}>{user?.firstName ?? ''}</span>
        <span className={styles.userName}>{user?.patronymic ?? ''}</span>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
