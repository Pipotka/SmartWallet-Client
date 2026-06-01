import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import type { LoginFormData } from '@/types';
import { useLogin } from '@/api/queries/user';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
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
  } else {
    if (values.password.length < 8) errors.password = 'Пароль должен содержать минимум 8 символов';
    else if (!/[A-ZА-Я]/.test(values.password)) errors.password = 'Пароль должен содержать хотя бы одну заглавную букву';
    else if (!/\d/.test(values.password)) errors.password = 'Пароль должен содержать хотя бы одну цифру';
    else if (!/[!@#$%^&*()_+=\]{};':"\\|,.<>?/[-]/.test(values.password)) errors.password = 'Пароль должен содержать хотя бы один специальный символ';
  }

  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showError = useToastStore((s) => s.showError);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      } catch (error) {
        const generalErrors = setServerErrors(error);
        generalErrors.forEach((msg) => showError(msg));
      }
    },
  });

  const { setServerErrors } = useFormServerErrors(form, {
    Email: 'email',
    Password: 'password',
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
