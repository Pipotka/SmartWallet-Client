import { useCallback } from 'react';
import type { UseFormReturn } from '@/hooks/useForm';
import { parseApiError } from '@/api/parseApiError';

export function useFormServerErrors<T extends { [K in keyof T]: string }>(
  form: UseFormReturn<T>,
  fieldMap?: Record<string, keyof T>,
): {
  setServerErrors: (error: unknown) => string[];
} {
  const setServerErrors = useCallback(
    (error: unknown): string[] => {
      const { fieldErrors, generalErrors } = parseApiError(error);

      const mappedFieldErrors: Partial<Record<keyof T, string>> = {};

      for (const [serverField, errorMessage] of Object.entries(fieldErrors)) {
        const formField = fieldMap
          ? fieldMap[serverField]
          : (serverField as keyof T);

        if (formField) {
          mappedFieldErrors[formField] = errorMessage;
        } else {
          generalErrors.push(errorMessage);
        }
      }

      if (Object.keys(mappedFieldErrors).length > 0) {
        form.setFieldErrors(mappedFieldErrors);
        form.setFieldTouched(mappedFieldErrors);
      }

      return generalErrors;
    },
    [form, fieldMap],
  );

  return { setServerErrors };
}
