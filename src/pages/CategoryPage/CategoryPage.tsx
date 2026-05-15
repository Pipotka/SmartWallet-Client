import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { CategoryCard, AddCard } from '@/components/CategoryCard/CategoryCard';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const endpoints = useWalletStore((s) => s.endpoints);
  const navigate = useNavigate();

  const wallets = endpoints.filter((e) => e.isStorage);
  const categories = endpoints.filter((e) => !e.isStorage);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.section}>
          <div className={styles.walletRow}>
            {wallets.map((wallet) => (
              <CategoryCard
                key={wallet.id}
                id={wallet.id}
                name={wallet.name}
                value={wallet.value}
                limitation={wallet.limitation}
                type="wallet"
              />
            ))}
            <AddCard onClick={() => navigate('/wallet/new')} />
          </div>
        </section>

        <hr className={styles.separator} />

        <section className={styles.section}>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                value={category.value}
                limitation={category.limitation}
                type="category"
              />
            ))}
            <AddCard onClick={() => navigate('/category/new')} />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
