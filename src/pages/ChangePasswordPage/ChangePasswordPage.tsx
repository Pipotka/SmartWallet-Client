import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon } from '@/components/Button/Button';
import { Toast } from '@/components/Toast/Toast';
import { useForm } from '@/hooks/useForm';
import { useChangePassword } from '@/api/queries/user';
import styles from './ChangePasswordPage.module.css';

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

function validateChangePassword(
  values: ChangePasswordFormData,
): Partial<Record<keyof ChangePasswordFormData, string>> {
  const errors: Partial<Record<keyof ChangePasswordFormData, string>> = {};

  if (!values.oldPassword) {
    errors.oldPassword = 'Поле обязательно для заполнения';
  }

  if (!values.newPassword) {
    errors.newPassword = 'Поле обязательно для заполнения';
  } else {
    if (values.newPassword.length < 8)
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
    else if (!/[A-ZА-Я]/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы одну заглавную букву';
    else if (!/\d/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы одну цифру';
    else if (!/[!@#$%^&*()_+=\]{};':"\\|,.<>?/[-]/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы один специальный символ';
  }

  if (!values.newPasswordConfirm) {
    errors.newPasswordConfirm = 'Поле обязательно для заполнения';
  } else if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = 'Пароли не совпадают';
  }

  return errors;
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [toastVisible, setToastVisible] = useState(false);
  const changePasswordMutation = useChangePassword();

  const handleSubmit = useCallback(async (values: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPasswordHash: values.oldPassword,
        newPasswordHash: values.newPassword,
      });
      setToastVisible(true);
    } catch {
      // Error handling — could show an error toast in the future
    }
  }, [changePasswordMutation]);

  const form = useForm<ChangePasswordFormData>({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    validate: validateChangePassword,
    onSubmit: handleSubmit,
  });

  const handleToastClose = () => {
    setToastVisible(false);
    navigate('/profile');
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.centerGroup}>
          <h2 className={styles.title}>Смена пароля</h2>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <InputField
              label="Старый пароль"
              type="password"
              value={form.values.oldPassword}
              onChange={form.handleChange('oldPassword')}
              onBlur={() => form.handleBlur('oldPassword')}
              error={!!form.touched.oldPassword && !!form.errors.oldPassword}
              errorText={form.touched.oldPassword ? form.errors.oldPassword : undefined}
            />
            <InputField
              label="Новый пароль"
              type="password"
              value={form.values.newPassword}
              onChange={form.handleChange('newPassword')}
              onBlur={() => form.handleBlur('newPassword')}
              error={!!form.touched.newPassword && !!form.errors.newPassword}
              errorText={form.touched.newPassword ? form.errors.newPassword : undefined}
            />
            <InputField
              label="Новый пароль ещё раз"
              type="password"
              value={form.values.newPasswordConfirm}
              onChange={form.handleChange('newPasswordConfirm')}
              onBlur={() => form.handleBlur('newPasswordConfirm')}
              error={!!form.touched.newPasswordConfirm && !!form.errors.newPasswordConfirm}
              errorText={form.touched.newPasswordConfirm ? form.errors.newPasswordConfirm : undefined}
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

        <div className={styles.profileLink}>
          <button
            type="button"
            className={styles.link}
            onClick={() => navigate('/profile')}
          >
            Профиль
          </button>
        </div>
      </main>

      <BottomNav />

      <Toast
        message="Пароль изменён"
        onClose={handleToastClose}
        visible={toastVisible}
      />
    </div>
  );
}
