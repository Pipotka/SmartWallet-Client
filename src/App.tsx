import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { TransactionPage } from '@/pages/TransactionPage/TransactionPage';
import { TransactionAddPage } from '@/pages/TransactionAddPage/TransactionAddPage';
import styles from './App.module.css';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<CategoryPage />} />
          <Route path="/wallet/:id" element={<EditWalletPage />} />
          <Route path="/category/:id" element={<EditCategoryPage />} />
          <Route path="/transactions/add" element={<TransactionAddPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;