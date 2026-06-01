import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  UserApiModelSchema,
  type CreateUserApiModel,
  type UpdateUserApiModel,
  type DeleteUserApiModel,
  type RequestLogInApiModel,
  ResponseLogInApiModelSchema,
  type ChangePasswordApiModel,
} from '@/api/schemas/user';
import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/users', 'GET', { signal }),
    select: (data) => UserApiModelSchema.parse(data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateUserApiModel) => {
      const data = await apiClient<unknown>('/api/users', 'POST', { body });
      return UserApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateUserApiModel) => {
      const data = await apiClient<unknown>('/api/users', 'PUT', { body });
      return UserApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteUserApiModel) =>
      apiClient<unknown>('/api/users', 'DELETE', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (body: RequestLogInApiModel) => {
      const data = await apiClient<unknown>('/api/users/login', 'PUT', { body, skipAuthRefresh: true });
      return ResponseLogInApiModelSchema.parse(data);
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAccessToken(data.accessToken);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<unknown>('/api/users/logout', 'POST'),
    onSuccess: () => {
      useAuthStore.getState().clearAuth();
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordApiModel) =>
      apiClient<unknown>('/api/users/password', 'PUT', { body }),
  });
}
