import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { CategoryCard, AddCard } from '@/components/CategoryCard/CategoryCard';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useWalletStore((s) => s.categories);
  const navigate = useNavigate();

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
                limit={wallet.limit}
                isOverLimit={wallet.isOverLimit}
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
                limit={category.limit}
                isOverLimit={category.isOverLimit}
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