import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FormField {
  id: string;
  label: string;
  type: string; // text, email, phone, select, textarea, date
  options: string | null; // JSON for select options
  required: boolean;
  order: number;
}

export function useFormFields(cardId?: string) {
  return useQuery<FormField[]>({
    queryKey: ['form-fields', cardId],
    queryFn: () =>
      api.get('/me/form-fields', { params: cardId ? { cardId } : {} }).then((r) => r.data),
  });
}

export function useCreateFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string; type: string; options?: string; required?: boolean; cardId?: string }) => {
      const { cardId, ...body } = data;
      return api.post('/me/form-fields', body, { params: cardId ? { cardId } : {} }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-fields'] }),
  });
}

export function useUpdateFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; label?: string; type?: string; options?: string; required?: boolean }) =>
      api.put(`/me/form-fields/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-fields'] }),
  });
}

export function useDeleteFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/form-fields/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-fields'] }),
  });
}

export function usePublicFormFields(slug: string) {
  return useQuery<FormField[]>({
    queryKey: ['public-form-fields', slug],
    queryFn: () => api.get(`/profile/${slug}/form-fields`).then((r) => r.data),
    enabled: !!slug,
  });
}
