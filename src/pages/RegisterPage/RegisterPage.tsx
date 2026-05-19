import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout/AuthLayout';
import { useForm } from '@/hooks/useForm';
import type { RegistrationFormData } from '@/types';
import { useWalletStore } from '@/store/useWalletStore';
import { InputField } from '@/components/InputField/InputField';
import { Button } from '@/components/Button/Button';
import styles from './RegisterPage.module.css';

function validateRegistration(values: RegistrationFormData): Partial<Record<keyof RegistrationFormData, string>> {
  const errors: Partial<Record<keyof RegistrationFormData, string>> = {};

  if (!values.firstName.trim()) errors.firstName = 'Поле обязательно для заполнения';
  if (!values.lastName.trim()) errors.lastName = 'Поле обязательно для заполнения';
  // middleName is optional

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
    else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.password)) errors.password = 'Пароль должен содержать хотя бы один специальный символ';
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = 'Поле обязательно для заполнения';
  } else if (values.password !== values.passwordConfirm) {
    errors.passwordConfirm = 'Пароли не совпадают';
  }

  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setUserInfo = useWalletStore((state) => state.setUserInfo);

  const form = useForm<RegistrationFormData>({
    initialValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
    validate: validateRegistration,
    onSubmit: (values) => {
      setUserInfo({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName,
      });
      navigate('/');
    },
  });

  return (
    <AuthLayout title="Регистрация в Smart Wallet">
      {/* Form */}
        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
          <InputField
            label="Имя"
            value={form.values.firstName}
            onChange={form.handleChange('firstName')}
            onBlur={() => form.handleBlur('firstName')}
            error={!!form.touched.firstName && !!form.errors.firstName}
            errorText={form.touched.firstName ? form.errors.firstName : undefined}
          />
          <InputField
            label="Фамилия"
            value={form.values.lastName}
            onChange={form.handleChange('lastName')}
            onBlur={() => form.handleBlur('lastName')}
            error={!!form.touched.lastName && !!form.errors.lastName}
            errorText={form.touched.lastName ? form.errors.lastName : undefined}
          />
          <InputField
            label="Отчество"
            value={form.values.middleName}
            onChange={form.handleChange('middleName')}
            onBlur={() => form.handleBlur('middleName')}
            error={!!form.touched.middleName && !!form.errors.middleName}
            errorText={form.touched.middleName ? form.errors.middleName : undefined}
          />
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
          <InputField
            label="Пароль ещё раз"
            type="password"
            value={form.values.passwordConfirm}
            onChange={form.handleChange('passwordConfirm')}
            onBlur={() => form.handleBlur('passwordConfirm')}
            error={!!form.touched.passwordConfirm && !!form.errors.passwordConfirm}
            errorText={form.touched.passwordConfirm ? form.errors.passwordConfirm : undefined}
          />

          <div className={styles.submitRow}>
            <Button variant="primary" fullWidth type="submit">
              Создать аккаунт
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className={styles.loginLink}>
          Уже есть аккаунт?{' '}
          <span
            className={styles.link}
            onClick={() => navigate('/login')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/login'); }}
          >
            Войти →
          </span>
        </div>
      </AuthLayout>
  );
}
