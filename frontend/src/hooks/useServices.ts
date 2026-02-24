import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Service {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  order: number;
}

export function useServices(enabled = true) {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/me/services'),
    enabled,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; price?: string }) =>
      api.post('/me/services', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string; price?: string }) =>
      api.put(`/me/services/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}

export function useReorderServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.put('/me/services-order', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });
}
