import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface GalleryImage {
  id: string;
  imageData: string;
  caption: string | null;
  order: number;
  createdAt: string;
}

export function useGallery() {
  return useQuery<GalleryImage[]>({
    queryKey: ['gallery'],
    queryFn: () => api.get('/me/gallery'),
  });
}

export function useUploadGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      return api.post('/me/gallery', formData);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api.delete(`/me/gallery/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useReorderGallery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: string[]) => api.put('/me/gallery/order', { imageIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}

export function useUpdateGalleryCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, caption }: { imageId: string; caption: string }) =>
      api.put(`/me/gallery/${imageId}/caption`, { caption }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gallery'] }),
  });
}
