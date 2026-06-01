import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon, TrashIcon } from '@/components/Button/Button';
import {
  useTransactionEndpoints,
  useCreateTransactionEndpoint,
  useUpdateTransactionEndpoint,
  useDeleteTransactionEndpoint,
} from '@/api/queries/transaction-endpoint';
import { useToastStore } from '@/store/useToastStore';
import { parseApiError } from '@/api/parseApiError';
import styles from './EditCategoryPage.module.css';

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: endpoints = [] } = useTransactionEndpoints();
  const createMutation = useCreateTransactionEndpoint();
  const updateMutation = useUpdateTransactionEndpoint();
  const deleteMutation = useDeleteTransactionEndpoint();
  const showError = useToastStore((s) => s.showError);
  const showSuccess = useToastStore((s) => s.showSuccess);

  const isNew = id === 'new';
  const endpoint = endpoints.find((e) => e.id === id && !e.isStorage);

  const [name, setName] = useState(endpoint?.name ?? '');
  const [limitation, setLimitation] = useState(String(endpoint?.limitation ?? ''));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const FIELD_MAP: Record<string, string> = {
    Name: 'name',
    Limitation: 'limitation',
  };

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

  const handleSave = async () => {
    const limitationNum = Number(limitation);

    // Clear previous client-side limitation error before re-validation
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.limitation;
      return next;
    });

    if (isNaN(limitationNum) || limitationNum <= 0) {
      setFieldErrors((prev) => ({ ...prev, limitation: 'Лимиты должны быть больше нуля' }));
      return;
    }

    try {
      if (isNew) {
        await createMutation.mutateAsync({ name, limitation: limitationNum, isStorage: false });
      } else {
        await updateMutation.mutateAsync({ id: id!, name, limitation: limitationNum });
      }
      showSuccess('Категория сохранена');
      navigate('/');
    } catch (error) {
      const { fieldErrors: serverFieldErrors, generalErrors } = parseApiError(error);
      const mappedFieldErrors: Record<string, string> = {};
      for (const [serverField, errorMessage] of Object.entries(serverFieldErrors)) {
        const formField = FIELD_MAP[serverField] ?? serverField;
        mappedFieldErrors[formField] = errorMessage;
      }
      setFieldErrors(mappedFieldErrors);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else if (Object.keys(mappedFieldErrors).length === 0) {
        showError('Произошла ошибка');
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!isNew) {
      try {
        await deleteMutation.mutateAsync({ id: id! });
        showSuccess('Категория удалена');
        navigate('/');
      } catch (error) {
        const { generalErrors } = parseApiError(error);
        if (generalErrors.length > 0) {
          generalErrors.forEach((msg) => showError(msg));
        } else {
          showError('Произошла ошибка');
        }
      }
    }
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
            error={!!fieldErrors.name}
            errorText={fieldErrors.name}
          />
          <InputField
            label="Лимиты"
            value={limitation}
            onChange={(val) => {
              setLimitation(val);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.limitation;
                return next;
              });
            }}
            onBlur={() => {
              const limitationNum = Number(limitation);
              if (isNaN(limitationNum) || limitationNum <= 0) {
                setFieldErrors((prev) => ({ ...prev, limitation: 'Лимиты должны быть больше нуля' }));
              } else {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.limitation;
                  return next;
                });
              }
            }}
            type="number"
            placeholder="0"
            error={!!fieldErrors.limitation}
            errorText={fieldErrors.limitation}
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
