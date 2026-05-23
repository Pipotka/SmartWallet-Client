import { useLocation, useNavigate } from 'react-router-dom';
import type { NavTab } from '@/types';
import categoriesIcon from '@/assets/categories-icon.svg';
import analyzeIcon from '@/assets/analyze-icon.svg';
import transactionIcon from '@/assets/transaction-icon.svg';
import profileIcon from '@/assets/profile-icon.svg';
import styles from './BottomNav.module.css';

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

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const isActive = item.key === 'profile'
          ? location.pathname.startsWith('/profile')
          : location.pathname === item.path;
        return (
          <button
            key={item.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className={styles.tabIcon}>
              <img src={item.icon} alt="" />
            </span>
            <span className={styles.tabLabel}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}