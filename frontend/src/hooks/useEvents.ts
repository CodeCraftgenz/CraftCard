import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Resumo de um evento (usado em listagens e detalhes) */
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

/** Hook para listar eventos do usuario autenticado */
export function useMyEvents() {
  return useQuery<EventSummary[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events'),
  });
}

/** Hook para buscar detalhes de um evento especifico */
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => api.get(`/events/${id}`),
    enabled: !!id,
  });
}

/** Hook para criar novo evento (invalida cache de listagem apos sucesso) */
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

/** Hook para atualizar evento existente */
export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; startDate?: string; endDate?: string; location?: string; isPublic?: boolean }) =>
      api.put(`/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

/** Hook para excluir evento */
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
