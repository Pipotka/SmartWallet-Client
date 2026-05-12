import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './EditWalletPage.module.css';

export function EditWalletPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);
  const updateWallet = useWalletStore((s) => s.updateWallet);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);

  const wallet = wallets.find((w) => w.id === id);

  const [name, setName] = useState(wallet?.name ?? '');
  const [limit, setLimit] = useState(String(wallet?.limit ?? ''));
  const [value, setValue] = useState(String(wallet?.value ?? ''));

  if (!wallet) {
    return (
      <div className={styles.page}>
        <Header showBackButton title="Кошелёк не найден" />
        <main className={styles.content}>
          <p>Кошелёк не найден</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitNum = Number(limit);
    const valueNum = Number(value);
    if (!isNaN(limitNum) && !isNaN(valueNum)) {
      updateWallet(id!, { name, limit: limitNum, value: valueNum });
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    deleteWallet(id!);
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header showBackButton title="Редактирование Кошелька" />

      <main className={styles.content}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название кошелька"
          />
          <InputField
            label="Лимиты"
            value={limit}
            onChange={setLimit}
            type="number"
            placeholder="0"
          />
          <InputField
            label="Значение"
            value={value}
            onChange={setValue}
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