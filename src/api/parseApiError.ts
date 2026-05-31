import { ApiError } from '@/api/client';
import { ApiExceptionDetailsSchema, ProblemDetailsSchema } from '@/api/schemas/common';

export interface ParsedApiError {
  fieldErrors: Record<string, string>;
  generalErrors: string[];
}

export function parseApiError(error: unknown): ParsedApiError {
  if (!(error instanceof ApiError)) {
    return { fieldErrors: {}, generalErrors: [] };
  }

  if (error.statusCode === 422) {
    return parse422Error(error);
  }

  if (error.statusCode === 400) {
    return parse400Error(error);
  }

  return parseOtherError(error);
}

function parse422Error(error: ApiError): ParsedApiError {
  const parsed = ApiExceptionDetailsSchema.safeParse(error.data);
  if (!parsed.success || !parsed.data.message) {
    return { fieldErrors: {}, generalErrors: ['Произошла ошибка'] };
  }

  const message = parsed.data.message;
  const fieldErrors: Record<string, string> = {};
  const generalErrors: string[] = [];

  const pairs = message.split(';');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(' - ');
    if (separatorIndex === -1) {
      generalErrors.push(trimmed);
      continue;
    }

    const fieldName = trimmed.substring(0, separatorIndex).trim();
    const errorMessage = trimmed.substring(separatorIndex + 3).trim();
    fieldErrors[fieldName] = errorMessage;
  }

  return { fieldErrors, generalErrors };
}

function parse400Error(error: ApiError): ParsedApiError {
  const parsed = ProblemDetailsSchema.safeParse(error.data);
  if (!parsed.success) {
    return { fieldErrors: {}, generalErrors: [getErrorMessage(error)] };
  }

  const problemDetails = parsed.data;
  const fieldErrors: Record<string, string> = {};
  const generalErrors: string[] = [];

  if (problemDetails.errors) {
    for (const [field, messages] of Object.entries(problemDetails.errors)) {
      if (messages.length > 0) {
        fieldErrors[field] = messages.join('; ');
      }
    }
  }

  if (problemDetails.detail) {
    generalErrors.push(problemDetails.detail);
  }

  if (Object.keys(fieldErrors).length === 0 && generalErrors.length === 0) {
    generalErrors.push(problemDetails.title ?? 'Произошла ошибка');
  }

  return { fieldErrors, generalErrors };
}

function parseOtherError(error: ApiError): ParsedApiError {
  return { fieldErrors: {}, generalErrors: [getErrorMessage(error)] };
}

function getErrorMessage(error: ApiError): string {
  const message = ApiExceptionDetailsSchema.safeParse(error.data);
  if (message.success && message.data.message) {
    return message.data.message;
  }
  return 'Произошла ошибка';
}