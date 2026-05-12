import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { CategoryCard, AddCard } from '@/components/CategoryCard/CategoryCard';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useWalletStore((s) => s.categories);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Кошельки</h2>
          <div className={styles.cardGrid}>
            {wallets.map((wallet) => (
              <CategoryCard
                key={wallet.id}
                id={wallet.id}
                name={wallet.name}
                amount={wallet.value}
                isOverLimit={wallet.isOverLimit}
                type="wallet"
              />
            ))}
            <AddCard onClick={() => {}} />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Категории</h2>
          <div className={styles.cardGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                isOverLimit={category.isOverLimit}
                type="category"
              />
            ))}
            <AddCard onClick={() => {}} />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}