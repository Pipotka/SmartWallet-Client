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
  const endpoints = useWalletStore((s) => s.endpoints);
  const addEndpoint = useWalletStore((s) => s.addEndpoint);
  const updateEndpoint = useWalletStore((s) => s.updateEndpoint);
  const deleteEndpoint = useWalletStore((s) => s.deleteEndpoint);

  const isNew = id === 'new';
  const endpoint = endpoints.find((e) => e.id === id && e.isStorage);

  const [name, setName] = useState(endpoint?.name ?? '');
  const [limitation, setLimitation] = useState(String(endpoint?.limitation ?? ''));
  const [value, setValue] = useState(String(endpoint?.value ?? ''));

  if (!endpoint && !isNew) {
    return (
      <div className={styles.page}>
        <Header pageTitle="Кошелёк не найден" />
        <main className={styles.content}>
          <p>Кошелёк не найден</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitationNum = Number(limitation);
    const valueNum = Number(value);
    if (!isNaN(limitationNum) && !isNaN(valueNum)) {
      if (isNew) {
        addEndpoint({ name, limitation: limitationNum, isStorage: true });
      } else {
        updateEndpoint(id!, { name, limitation: limitationNum, value: valueNum });
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
      <Header pageTitle={isNew ? 'Новый кошелёк' : 'Редактирование Кошелька'} />

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
            value={limitation}
            onChange={setLimitation}
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
            {!isNew && (
              <Button variant="danger" onClick={handleDelete}>
                Удал
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
