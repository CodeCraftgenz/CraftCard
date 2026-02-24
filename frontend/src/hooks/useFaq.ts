import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export function useFaq(enabled = true) {
  return useQuery<FaqItem[]>({
    queryKey: ['faq'],
    queryFn: () => api.get('/me/faq'),
    enabled,
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { question: string; answer: string }) =>
      api.post('/me/faq', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faq'] }),
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; question?: string; answer?: string }) =>
      api.put(`/me/faq/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faq'] }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/faq/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faq'] }),
  });
}

export function useReorderFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.put('/me/faq-order', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['faq'] }),
  });
}
