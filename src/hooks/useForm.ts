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
  setFieldErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setFieldTouched: (fields: Partial<Record<keyof T, string>>) => void;
}

export function useForm<T extends { [K in keyof T]: string }>(
  options: UseFormOptions<T>,
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valuesRef = useRef<T>(initialValues);
  const validateRef = useRef(validate);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const handleChange = useCallback((field: keyof T) => (value: string) => {
    const next = { ...valuesRef.current, [field]: value };
    setValues(next);
    const clientErrors = validateRef.current(next);
    // Only update the error for the field being edited; preserve errors for other fields (including server errors)
    setErrors((prev) => ({ ...prev, [field]: clientErrors[field] }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const clientErrors = validateRef.current(valuesRef.current);
    // Only update the error for the blurred field; preserve errors for other fields
    setErrors((prev) => ({ ...prev, [field]: clientErrors[field] }));
  }, []);

  const handleSubmit = useCallback(() => {
    const currentValues = valuesRef.current;
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(currentValues) as Array<keyof T>) {
      allTouched[key] = true;
    }

    setTouched(allTouched);

    const validationErrors = validateRef.current(currentValues);
    // On submit, merge client errors with existing server errors
    setErrors((prev) => ({ ...prev, ...validationErrors }));

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== undefined && error !== '',
    );

    if (!hasErrors) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSubmitRef.current(currentValues);
        setIsSubmitting(false);
      }, 0);
    }
  }, []);

  const setFieldErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setErrors((prev) => ({ ...prev, ...errors }));
  }, []);

  const setFieldTouched = useCallback((fields: Partial<Record<keyof T, string>>) => {
    const newTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(fields) as Array<keyof T>) {
      newTouched[key] = true;
    }
    setTouched((prev) => ({ ...prev, ...newTouched }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldErrors,
    setFieldTouched,
  };
}
