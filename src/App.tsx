import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { TransactionPage } from '@/pages/TransactionPage/TransactionPage';
import { TransactionAddPage } from '@/pages/TransactionAddPage/TransactionAddPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import styles from './App.module.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={styles.app}>
      {!isAuthPage && <Sidebar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<CategoryPage />} />
        <Route path="/wallet/:id" element={<EditWalletPage />} />
        <Route path="/category/:id" element={<EditCategoryPage />} />
        <Route path="/transactions/add" element={<TransactionAddPage />} />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/change-password" element={<ChangePasswordPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
