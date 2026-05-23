import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon } from '@/components/Button/Button';
import { Toast } from '@/components/Toast/Toast';
import { useWalletStore } from '@/store/useWalletStore';
import { useForm } from '@/hooks/useForm';
import styles from './ProfilePage.module.css';

interface ProfileFormData {
  lastName: string;
  firstName: string;
  middleName: string;
}

function validateProfile(values: ProfileFormData): Partial<Record<keyof ProfileFormData, string>> {
  const errors: Partial<Record<keyof ProfileFormData, string>> = {};
  if (!values.lastName.trim()) errors.lastName = 'Поле обязательно для заполнения';
  if (!values.firstName.trim()) errors.firstName = 'Поле обязательно для заполнения';
  // middleName is optional — no validation
  return errors;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const userInfo = useWalletStore((state) => state.userInfo);
  const setUserInfo = useWalletStore((state) => state.setUserInfo);

  const [toastVisible, setToastVisible] = useState(false);

  const handleSubmit = useCallback((values: ProfileFormData) => {
    setUserInfo(values);
    setToastVisible(true);
  }, [setUserInfo]);

  const initialValues = useMemo(() => ({
    lastName: userInfo.lastName,
    firstName: userInfo.firstName,
    middleName: userInfo.middleName,
  }), [userInfo]);

  const form = useForm<ProfileFormData>({
    initialValues,
    validate: validateProfile,
    onSubmit: handleSubmit,
  });

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.centerGroup}>
          <h2 className={styles.title}>Редактирование профиля</h2>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <InputField
              label="Фамилия"
              value={form.values.lastName}
              onChange={form.handleChange('lastName')}
              onBlur={() => form.handleBlur('lastName')}
              error={!!form.touched.lastName && !!form.errors.lastName}
              errorText={form.touched.lastName ? form.errors.lastName : undefined}
            />
            <InputField
              label="Имя"
              value={form.values.firstName}
              onChange={form.handleChange('firstName')}
              onBlur={() => form.handleBlur('firstName')}
              error={!!form.touched.firstName && !!form.errors.firstName}
              errorText={form.touched.firstName ? form.errors.firstName : undefined}
            />
            <InputField
              label="Отчество"
              value={form.values.middleName}
              onChange={form.handleChange('middleName')}
              onBlur={() => form.handleBlur('middleName')}
              error={!!form.touched.middleName && !!form.errors.middleName}
              errorText={form.touched.middleName ? form.errors.middleName : undefined}
            />

            <div className={styles.submitRow}>
              <Button
                variant="primary"
                fullWidth
                type="submit"
                icon={<SaveIcon />}
                disabled={form.isSubmitting}
              >
                Сохранить
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.changePasswordLink}>
          <button
            type="button"
            className={styles.link}
            onClick={() => navigate('/profile/change-password')}
          >
            Изменить пароль
          </button>
        </div>
      </main>

      <BottomNav />

      <Toast
        message="Профиль обновлён"
        onClose={() => setToastVisible(false)}
        visible={toastVisible}
      />
    </div>
  );
}
