import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon } from '@/components/Button/Button';
import { useUser, useUpdateUser, useLogout } from '@/api/queries/user';
import { useForm } from '@/hooks/useForm';
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import { useToastStore } from '@/store/useToastStore';
import styles from './ProfilePage.module.css';

interface ProfileFormData {
  lastName: string;
  firstName: string;
  patronymic: string;
}

function validateProfile(values: ProfileFormData): Partial<Record<keyof ProfileFormData, string>> {
  const errors: Partial<Record<keyof ProfileFormData, string>> = {};
  if (!values.lastName.trim()) errors.lastName = 'Поле обязательно для заполнения';
  if (!values.firstName.trim()) errors.firstName = 'Поле обязательно для заполнения';
  return errors;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const updateMutation = useUpdateUser();
  const logoutMutation = useLogout();
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = async (values: ProfileFormData) => {
    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        patronymic: values.patronymic,
      });
      showSuccess('Профиль обновлён');
    } catch (error) {
      const generalErrors = setServerErrors(error);
      generalErrors.forEach((msg) => showError(msg));
    }
  };

  const handleLogout = useCallback(() => {
    if (!window.confirm('Вы уверены, что хотите выйти?')) {
      return;
    }
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: () => {
        showError('Ошибка выхода, попробуйте снова');
      },
    });
  }, [logoutMutation, navigate, showError]);

  const initialValues = useMemo(() => ({
    lastName: user?.lastName ?? '',
    firstName: user?.firstName ?? '',
    patronymic: user?.patronymic ?? '',
  }), [user]);

  const form = useForm<ProfileFormData>({
    initialValues,
    validate: validateProfile,
    onSubmit: handleSubmit,
  });

  const { setServerErrors } = useFormServerErrors(form, {
    FirstName: 'firstName',
    LastName: 'lastName',
    Patronymic: 'patronymic',
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
              value={form.values.patronymic}
              onChange={form.handleChange('patronymic')}
              onBlur={() => form.handleBlur('patronymic')}
              error={!!form.touched.patronymic && !!form.errors.patronymic}
              errorText={form.touched.patronymic ? form.errors.patronymic : undefined}
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

        <div className={styles.logoutSection}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            Выйти из аккаунта
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
