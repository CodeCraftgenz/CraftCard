import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface EventSummary {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  slug: string;
  isPublic: boolean;
  connectionCount: number;
  createdAt: string;
}

/** Hook para buscar dados publicos de um evento pelo slug (sem autenticacao) */
export function usePublicEvent(slug: string | undefined) {
  return useQuery<EventSummary>({
    queryKey: ['event-public', slug],
    queryFn: () => api.get(`/events/public/${slug}`),
    enabled: !!slug,
    retry: 1,
    staleTime: 60_000,
  });
}

export function useMyEvents() {
  return useQuery<EventSummary[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events'),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => api.get(`/events/${id}`),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      startDate: string;
      endDate?: string;
      location?: string;
      isPublic?: boolean;
    }) => api.post('/events', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; startDate?: string; endDate?: string; location?: string; isPublic?: boolean }) =>
      api.put(`/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
