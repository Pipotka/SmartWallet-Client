import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon, TrashIcon } from '@/components/Button/Button';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './EditCategoryPage.module.css';

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const endpoints = useWalletStore((s) => s.endpoints);
  const addEndpoint = useWalletStore((s) => s.addEndpoint);
  const updateEndpoint = useWalletStore((s) => s.updateEndpoint);
  const deleteEndpoint = useWalletStore((s) => s.deleteEndpoint);

  const isNew = id === 'new';
  const endpoint = endpoints.find((e) => e.id === id && !e.isStorage);

  const [name, setName] = useState(endpoint?.name ?? '');
  const [limitation, setLimitation] = useState(String(endpoint?.limitation ?? ''));

  if (!endpoint && !isNew) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <h2 className={styles.title}>Категория не найдена</h2>
          <p>Категория не найдена</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitationNum = Number(limitation);
    if (!isNaN(limitationNum)) {
      if (isNew) {
        addEndpoint({ name, limitation: limitationNum, isStorage: false });
      } else {
        updateEndpoint(id!, { name, limitation: limitationNum });
      }
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    if (!isNew) {
      deleteEndpoint(id!);
    }
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <h2 className={styles.title}>{isNew ? 'Новая категория' : 'Редактирование категории'}</h2>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название категории"
          />
          <InputField
            label="Лимиты"
            value={limitation}
            onChange={setLimitation}
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
            {!isNew && (
              <Button variant="danger" onClick={handleDelete} className={styles.deleteBtn} icon={<TrashIcon />} />
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
