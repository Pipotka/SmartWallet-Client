// Wallet and category data is now served by TanStack Query hooks:
//   useTransactionEndpoints() from @/api/queries/transaction-endpoint
//   useUser() from @/api/queries/user
//
// This file is kept as a placeholder. If UI-only wallet state is needed
// in the future, add it here. For now, all server data comes from
// TanStack Query hooks.

export { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';
export { useUser } from '@/api/queries/user';
