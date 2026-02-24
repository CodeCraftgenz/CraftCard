import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PlanLimits } from '@/providers/AuthProvider';

export interface BillingPayment {
  id: string;
  amount: number;
  status: string;
  plan: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface BillingInfo {
  plan: string;
  planLimits: PlanLimits;
  expiresAt: string | null;
  daysRemaining: number | null;
  payments: BillingPayment[];
  canUpgrade: boolean;
  canRenew: boolean;
}

export function useBillingInfo() {
  return useQuery<BillingInfo>({
    queryKey: ['billing'],
    queryFn: () => api.get('/payments/billing'),
  });
}

export function useCheckout() {
  return useMutation<{ url: string }, Error, { plan: string }>({
    mutationFn: (data) => api.post('/payments/checkout', data),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
