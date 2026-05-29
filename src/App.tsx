import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ProtectedRoute, AuthInitGuard } from '@/components/ProtectedRoute/ProtectedRoute';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { TransactionPage } from '@/pages/TransactionPage/TransactionPage';
import { TransactionAddPage } from '@/pages/TransactionAddPage/TransactionAddPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { AnalyticsPage } from '@/pages/AnalyticsPage/AnalyticsPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import styles from './App.module.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`${styles.app} ${isAuthPage ? styles.authPage : ''}`}>
      {!isAuthPage && <Sidebar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
        <Route path="/wallet/:id" element={<ProtectedRoute><EditWalletPage /></ProtectedRoute>} />
        <Route path="/category/:id" element={<ProtectedRoute><EditCategoryPage /></ProtectedRoute>} />
        <Route path="/transactions/add" element={<ProtectedRoute><TransactionAddPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitGuard>
        <AppContent />
      </AuthInitGuard>
    </BrowserRouter>
  );
}

export default App;
