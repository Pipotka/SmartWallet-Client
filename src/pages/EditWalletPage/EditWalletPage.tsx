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
import { useCreateTransaction } from '@/api/queries/transaction';
import type { CreateTransactionApiModel } from '@/api/schemas/transaction';
import { useToastStore } from '@/store/useToastStore';
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog';
import { parseApiError } from '@/api/parseApiError';
import styles from './EditWalletPage.module.css';

const FIELD_MAP: Record<string, string> = {
  Name: 'name',
  Limitation: 'limitation',
};

export function EditWalletPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: endpoints = [] } = useTransactionEndpoints();
  const createMutation = useCreateTransactionEndpoint();
  const updateMutation = useUpdateTransactionEndpoint();
  const deleteMutation = useDeleteTransactionEndpoint();
  const createTransactionMutation = useCreateTransaction();

  const showError = useToastStore((s) => s.showError);
  const showSuccess = useToastStore((s) => s.showSuccess);

  const isNew = id === 'new';
  const endpoint = endpoints.find((e) => e.id === id && e.isStorage);

  const [name, setName] = useState(endpoint?.name ?? '');
  const [limitation, setLimitation] = useState(String(endpoint?.limitation ?? ''));
  const [value, setValue] = useState(String(endpoint?.value ?? ''));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!endpoint && !isNew) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <h2 className={styles.title}>Кошелёк не найден</h2>
          <p>Кошелёк не найден</p>
        </main>
      </div>
    );
  }

  const handleSave = async () => {
    const limitationNum = Number(limitation);
    const valueNum = Number(value);

    // Clear previous client-side limitation error before re-validation
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.limitation;
      return next;
    });

    if (limitation !== '' && (isNaN(limitationNum) || limitationNum <= 0)) {
      setFieldErrors((prev) => ({ ...prev, limitation: 'Лимиты должны быть больше нуля' }));
      return;
    }

    if (value !== '' && (isNaN(valueNum) || valueNum <= 0)) {
      setFieldErrors((prev) => ({ ...prev, value: 'Значение должно быть больше нуля' }));
      return;
    }

    const limitationValue = limitation === '' ? null : limitationNum;

    if (!isNaN(valueNum)) {
      try {
        if (isNew) {
          const newWallet = await createMutation.mutateAsync({ name, limitation: limitationValue, isStorage: true });
          if (valueNum > 0) {
            const txBody: CreateTransactionApiModel = {
              sourceAccountId: null,
              destinationAccountId: newWallet.id,
              amount: valueNum,
            };
            await createTransactionMutation.mutateAsync(txBody);
          }
        } else {
          await updateMutation.mutateAsync({ id: id!, name, limitation: limitationValue });
          const originalValue = endpoint!.value;
          if (valueNum !== originalValue) {
            const txBody: CreateTransactionApiModel =
              valueNum > originalValue
                ? {
                    sourceAccountId: null,
                    destinationAccountId: id!,
                    amount: valueNum - originalValue,
                  }
                : {
                    sourceAccountId: id!,
                    destinationAccountId: null,
                    amount: originalValue - valueNum,
                  };
            await createTransactionMutation.mutateAsync(txBody);
          }
        }
        showSuccess('Кошелёк сохранён');
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
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    setConfirmOpen(false);
    if (!isNew) {
      try {
        await deleteMutation.mutateAsync({ id: id! });
        showSuccess('Кошелёк удалён');
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
        <h2 className={styles.title}>{isNew ? 'Новый кошелёк' : 'Редактирование Кошелька'}</h2>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название кошелька"
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
              if (limitation === '') {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.limitation;
                  return next;
                });
                return;
              }
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
          <InputField
            label="Значение"
            value={value}
            onChange={(val) => {
              setValue(val);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.value;
                return next;
              });
            }}
            onBlur={() => {
              if (value === '') {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.value;
                  return next;
                });
                return;
              }
              const valueNum = Number(value);
              if (isNaN(valueNum) || valueNum <= 0) {
                setFieldErrors((prev) => ({ ...prev, value: 'Значение должно быть больше нуля' }));
              } else {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.value;
                  return next;
                });
              }
            }}
            type="number"
            placeholder="0"
            error={!!fieldErrors.value}
            errorText={fieldErrors.value}
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
              <Button variant="danger" onClick={() => setConfirmOpen(true)} className={styles.deleteBtn} icon={<TrashIcon />} />
            )}
          </div>
        </form>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Удаление кошелька"
        message={`Удалить кошелёк «${name}»?`}
        confirmLabel="Удалить"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
