import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseFormOptions<T> {
  initialValues: T;
  validate: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (value: string) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: () => void;
}

export function useForm<T extends Record<string, string>>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valuesRef = useRef<T>(initialValues);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const runValidation = useCallback(
    (currentValues: T) => {
      setErrors(validate(currentValues));
    },
    [validate],
  );

  const handleChange = useCallback(
    (field: keyof T) => (value: string) => {
      const next = { ...valuesRef.current, [field]: value };
      setValues(next);
      runValidation(next);
    },
    [runValidation],
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      runValidation(valuesRef.current);
    },
    [runValidation],
  );

  const handleSubmit = useCallback(() => {
    const currentValues = valuesRef.current;
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(currentValues) as Array<keyof T>) {
      allTouched[key] = true;
    }

    setTouched(allTouched);

    const validationErrors = validate(currentValues);
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== undefined && error !== '',
    );

    if (!hasErrors) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSubmit(currentValues);
        setIsSubmitting(false);
      }, 0);
    }
  }, [validate, onSubmit]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}
