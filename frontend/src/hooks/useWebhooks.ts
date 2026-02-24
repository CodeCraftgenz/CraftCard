import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export function useWebhooks() {
  return useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then((r) => r.data),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; events: string[] }) =>
      api.post('/webhooks', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; url?: string; events?: string[]; isActive?: boolean }) =>
      api.put(`/webhooks/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/webhooks/${id}/test`).then((r) => r.data),
  });
}
