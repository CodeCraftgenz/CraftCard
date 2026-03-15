import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  connectionCount: number;
}

export function useMyTags() {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags'),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => api.post('/tags', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string }) =>
      api.put(`/tags/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useAssignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, tagId }: { connectionId: string; tagId: string }) =>
      api.post(`/tags/connections/${connectionId}`, { tagId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

export function useRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, tagId }: { connectionId: string; tagId: string }) =>
      api.delete(`/tags/connections/${connectionId}/${tagId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}
