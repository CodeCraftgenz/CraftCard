import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ContactMessage {
  id: string;
  senderName: string;
  senderEmail: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useContacts(enabled: boolean) {
  return useQuery<ContactMessage[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts/me'),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => api.patch(`/contacts/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { senderName: string; senderEmail?: string; message: string } }) =>
      api.post(`/contacts/${slug}`, data),
  });
}
