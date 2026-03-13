import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ConnectionProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  slug: string;
  tagline: string | null;
}

export interface MyConnection {
  id: string;
  connectedAt: string | null;
  profile: ConnectionProfile;
}

export interface PendingConnection {
  id: string;
  createdAt: string;
  requester: ConnectionProfile;
  addressee: { id: string; displayName: string };
}

export interface ConnectionStatus {
  status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  connectionId: string | null;
  direction?: 'SENT' | 'RECEIVED';
}

export interface DiscoverResult {
  profiles: Array<ConnectionProfile & { location: string | null }>;
  total: number;
  page: number;
  totalPages: number;
}

export function useMyConnections(profileId?: string) {
  const params = profileId ? `?profileId=${profileId}` : '';
  return useQuery<MyConnection[]>({
    queryKey: ['connections', 'mine', profileId],
    queryFn: () => api.get(`/connections/mine${params}`),
  });
}

export function usePendingConnections() {
  return useQuery<PendingConnection[]>({
    queryKey: ['connections', 'pending'],
    queryFn: () => api.get('/connections/pending'),
  });
}

export function useConnectionStatus(profileId: string | undefined) {
  return useQuery<ConnectionStatus>({
    queryKey: ['connections', 'status', profileId],
    queryFn: () => api.get(`/connections/status/${profileId}`),
    enabled: !!profileId,
  });
}

export function useRequestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromProfileId: string; toProfileId: string }) =>
      api.post('/connections/request', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useRequestBySlug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { fromProfileId: string; slug: string }) =>
      api.post('/connections/request-by-slug', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useAcceptConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/connections/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useRejectConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/connections/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useRemoveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/connections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useDiscoverProfiles(query: string, page = 1) {
  return useQuery<DiscoverResult>({
    queryKey: ['connections', 'discover', query, page],
    queryFn: () => api.get(`/connections/discover?q=${encodeURIComponent(query)}&page=${page}`),
    enabled: true,
  });
}
