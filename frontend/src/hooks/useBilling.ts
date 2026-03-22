import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PlanLimits } from '@/providers/AuthProvider';

/** Dados de um pagamento individual */
export interface BillingPayment {
  id: string;
  amount: number;
  status: string;
  plan: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/** Informacoes completas de cobranca do usuario (plano, limites, pagamentos) */
export interface BillingInfo {
  plan: string;
  planLimits: PlanLimits;
  expiresAt: string | null;
  daysRemaining: number | null;
  payments: BillingPayment[];
  canUpgrade: boolean;
  canRenew: boolean;
}

/** Hook para buscar informacoes de cobranca e plano do usuario */
export function useBillingInfo() {
  return useQuery<BillingInfo>({
    queryKey: ['billing'],
    queryFn: () => api.get('/payments/billing'),
  });
}

/** Hook para iniciar checkout — redireciona para pagina de pagamento do Mercado Pago */
export function useCheckout() {
  return useMutation<{ url: string }, Error, { plan: string }>({
    mutationFn: (data) => api.post('/payments/checkout', data),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
