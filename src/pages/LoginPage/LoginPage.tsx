import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import type { LoginFormData } from '@/types';
import { useLogin } from '@/api/queries/user';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthLayout } from '@/components/AuthLayout/AuthLayout';
import { InputField } from '@/components/InputField/InputField';
import { Button } from '@/components/Button/Button';
import styles from './LoginPage.module.css';

function validateLogin(values: LoginFormData): Partial<Record<keyof LoginFormData, string>> {
  const errors: Partial<Record<keyof LoginFormData, string>> = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!values.email.trim()) {
    errors.email = 'Поле обязательно для заполнения';
  } else if (!emailRegex.test(values.email)) {
    errors.email = 'Введите корректный email';
  }

  if (!values.password) {
    errors.password = 'Поле обязательно для заполнения';
  }

  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: validateLogin,
    onSubmit: async (values) => {
      try {
        await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
        });
        navigate('/');
      } catch {
        // Error handling — could show a toast in the future
      }
    },
  });

  return (
    <AuthLayout title="Вход в Smart Wallet">
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <InputField
          label="Email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={() => form.handleBlur('email')}
          error={!!form.touched.email && !!form.errors.email}
          errorText={form.touched.email ? form.errors.email : undefined}
        />
        <InputField
          label="Пароль"
          type="password"
          value={form.values.password}
          onChange={form.handleChange('password')}
          onBlur={() => form.handleBlur('password')}
          error={!!form.touched.password && !!form.errors.password}
          errorText={form.touched.password ? form.errors.password : undefined}
        />

        <div className={styles.submitRow}>
          <Button variant="primary" fullWidth type="submit">
            Войти
          </Button>
        </div>
      </form>

      <div className={styles.registerLink}>
        Новый пользователь Smart Wallet?
        <br />
        <span
          className={styles.link}
          onClick={() => navigate('/register')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/register'); }}
        >
          Создать аккаунт
        </span>
      </div>
    </AuthLayout>
  );
}
