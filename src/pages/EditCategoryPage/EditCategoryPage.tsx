import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './EditCategoryPage.module.css';

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categories = useWalletStore((s) => s.categories);
  const updateCategory = useWalletStore((s) => s.updateCategory);
  const deleteCategory = useWalletStore((s) => s.deleteCategory);

  const category = categories.find((c) => c.id === id);

  const [name, setName] = useState(category?.name ?? '');
  const [limit, setLimit] = useState(String(category?.limit ?? ''));

  if (!category) {
    return (
      <div className={styles.page}>
        <Header showBackButton title="Категория не найдена" />
        <main className={styles.content}>
          <p>Категория не найдена</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitNum = Number(limit);
    if (!isNaN(limitNum)) {
      updateCategory(id!, { name, limit: limitNum });
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    deleteCategory(id!);
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header showBackButton title="Редактирование категории" />

      <main className={styles.content}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название категории"
          />
          <InputField
            label="Лимиты"
            value={limit}
            onChange={setLimit}
            type="number"
            placeholder="0"
          />

          <hr className={styles.separator} />

          <div className={styles.buttonGroup}>
            <Button variant="primary" onClick={handleSave} icon={<SaveIcon />}>
              Сохранить
            </Button>
            <Button variant="neutral" onClick={handleCancel} icon={<CloseIcon />}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Удал
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}