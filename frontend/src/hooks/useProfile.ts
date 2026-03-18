/**
 * useProfile.ts — Hooks React Query para gerenciamento do perfil/cartao do usuario.
 *
 * Cada usuario pode ter multiplos cartoes (limitado pelo plano).
 * Um cartao = um perfil publico acessivel via /:slug.
 *
 * Hooks de query: leitura de perfil, listagem de cartoes, verificacao de slug
 * Hooks de mutation: atualizacao de perfil, upload de midia, CRUD de cartoes
 *
 * Todas as mutations invalidam queries relacionadas para manter o cache sincronizado.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Link social do perfil (Instagram, LinkedIn, WhatsApp, etc) com ordenacao e agendamento */
interface SocialLink {
  id?: string;
  platform: string;
  label: string;
  url: string;
  order: number;
  startsAt?: string | null;
  endsAt?: string | null;
  linkType?: string | null;
  metadata?: string | null;
}

/** Dados completos do perfil/cartao. Inclui personalizacao visual e features toggles */
export interface Profile {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  resumeUrl: string | null;
  resumeType: string | null;
  buttonColor: string;
  slug: string;
  isPublished: boolean;
  viewCount: number;
  cardTheme: string;
  coverPhotoUrl: string | null;
  photoPositionY: number;
  coverPositionY: number;
  availabilityStatus: string | null;
  availabilityMessage: string | null;
  videoUrl: string | null;
  leadCaptureEnabled: boolean;
  bookingEnabled: boolean;
  resumeEnabled?: boolean;
  contactFormEnabled?: boolean;
  testimonialsEnabled?: boolean;
  galleryEnabled?: boolean;
  servicesEnabled?: boolean;
  faqEnabled?: boolean;
  fontFamily?: string | null;
  fontSizeScale?: number | null;
  backgroundType?: string | null;
  backgroundGradient?: string | null;
  backgroundImageUrl?: string | null;
  backgroundOverlay?: number | null;
  backgroundPattern?: string | null;
  linkLayout?: string | null;
  linkStyle?: string | null;
  linkAnimation?: string | null;
  iconStyle?: string | null;
  connectionsEnabled?: boolean;
  orgId?: string | null;
  socialLinks: SocialLink[];
}

/**
 * Busca o perfil do usuario autenticado.
 * Se cardId for fornecido, busca o perfil daquele cartao especifico.
 * Sem cardId, retorna o cartao primario.
 */
export function useProfile(cardId?: string, enabled = true) {
  const params = cardId ? `?cardId=${cardId}` : '';
  return useQuery<Profile>({
    queryKey: ['profile', cardId || 'primary'],
    queryFn: () => api.get(`/me/profile${params}`),
    enabled,
  });
}

/**
 * Atualiza o perfil do cartao. Aceita dados parciais + links sociais.
 * Invalida profile, me e cards para manter tudo sincronizado.
 */
export function useUpdateProfile(cardId?: string) {
  const queryClient = useQueryClient();
  const params = cardId ? `?cardId=${cardId}` : '';

  return useMutation({
    mutationFn: (data: Partial<Profile> & { socialLinks?: SocialLink[] }) =>
      api.put(`/me/profile${params}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

/** Lista todos os cartoes do usuario (id, label, slug, isPrimary) */
export function useCards() {
  return useQuery<Array<{ id: string; label: string; slug: string; isPrimary: boolean; displayName: string }>>({
    queryKey: ['cards'],
    queryFn: () => api.get('/me/cards'),
  });
}

/** Cria um novo cartao. Limitado pelo maxCards do plano do usuario */
export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (label: string) => api.post('/me/cards', { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/me/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Define qual cartao e o primario (exibido no /:slug padrao do usuario) */
export function useSetPrimaryCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.put(`/me/cards/${id}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Upload da foto de perfil (avatar) — exibida no cartao publico */
export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/photo-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Upload da foto de capa (banner no topo do cartao) */
export function useUploadCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/cover-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Upload de curriculo (PDF) — feature PRO+ */
export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/resume-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Upload de video de apresentacao — exibido inline no cartao publico */
export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/video-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** Upload de imagem de fundo customizada — feature PRO+ */
export function useUploadBackground() {
  const queryClient = useQueryClient();

  return useMutation<{ url: string }, Error, File>({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/me/background-upload', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useDeleteBackground() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete('/me/background'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Verifica disponibilidade de um slug em tempo real.
 * Ativado apenas quando slug >= 3 caracteres para evitar consultas desnecessarias.
 */
export function useCheckSlug(slug: string, enabled: boolean) {
  return useQuery<{ slug: string; available: boolean }>({
    queryKey: ['slug-check', slug],
    queryFn: () => api.get(`/slug/check/${slug}`),
    enabled: enabled && slug.length >= 3,
  });
}
