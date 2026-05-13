import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import styles from './App.module.css';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<CategoryPage />} />
          <Route path="/wallet/:id" element={<EditWalletPage />} />
          <Route path="/category/:id" element={<EditCategoryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;