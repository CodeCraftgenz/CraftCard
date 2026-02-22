import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  text: string;
  isApproved: boolean;
  createdAt: string;
}

export function useTestimonials(enabled: boolean) {
  return useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/testimonials/me'),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useApproveTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/testimonials/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}

export function useRejectTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}

export function useSubmitTestimonial() {
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { authorName: string; authorRole?: string; text: string } }) =>
      api.post(`/testimonials/${slug}`, data),
  });
}
