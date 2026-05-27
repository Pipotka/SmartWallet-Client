import { z } from 'zod';

export const UserApiModelSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  patronymic: z.string().nullable(),
});

export type UserApiModel = z.infer<typeof UserApiModelSchema>;

export const CreateUserApiModelSchema = z.object({
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  patronymic: z.string().nullable(),
  password: z.string().nullable(),
});

export type CreateUserApiModel = z.infer<typeof CreateUserApiModelSchema>;

export const UpdateUserApiModelSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  patronymic: z.string().nullable(),
});

export type UpdateUserApiModel = z.infer<typeof UpdateUserApiModelSchema>;

export const DeleteUserApiModelSchema = z.object({
  password: z.string().nullable(),
});

export type DeleteUserApiModel = z.infer<typeof DeleteUserApiModelSchema>;

export const RequestLogInApiModelSchema = z.object({
  email: z.string().nullable(),
  password: z.string().nullable(),
});

export type RequestLogInApiModel = z.infer<typeof RequestLogInApiModelSchema>;

export const ResponseLogInApiModelSchema = z.object({
  accessToken: z.string(),
});

export type ResponseLogInApiModel = z.infer<typeof ResponseLogInApiModelSchema>;

export const ResponseRefreshApiModelSchema = z.object({
  accessToken: z.string(),
});

export type ResponseRefreshApiModel = z.infer<typeof ResponseRefreshApiModelSchema>;

export const ChangePasswordApiModelSchema = z.object({
  oldPassword: z.string().nullable(),
  newPassword: z.string().nullable(),
});

export type ChangePasswordApiModel = z.infer<typeof ChangePasswordApiModelSchema>;
