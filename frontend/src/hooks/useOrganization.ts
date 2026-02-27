import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  brandingActive: boolean;
  memberCount: number;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  domain: string | null;
  maxMembers: number;
  extraSeats: number;
  brandingActive: boolean;
  cardTheme: string | null;
  linkStyle: string | null;
  linkAnimation: string | null;
  backgroundType: string | null;
  backgroundGradient: string | null;
  memberCount: number;
  profileCount: number;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    profileSlug: string | null;
  };
}

export interface OrgInvite {
  id: string;
  orgId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export interface OrgAnalytics {
  totalViews: number;
  totalMessages: number;
  totalBookings: number;
  memberProfiles: Array<{ id: string; displayName: string; slug: string; viewCount: number }>;
  dailyViews: Array<{ date: string; count: number }>;
}

export interface OrgLead {
  id: string;
  senderName: string;
  senderEmail: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  profile: { displayName: string; slug: string };
}

// --- Queries ---

export function useMyOrganizations() {
  return useQuery<OrgSummary[]>({
    queryKey: ['organizations', 'me'],
    queryFn: () => api.get('/organizations/me'),
  });
}

export function useOrganization(orgId: string | undefined) {
  return useQuery<Organization>({
    queryKey: ['organization', orgId],
    queryFn: () => api.get(`/organizations/${orgId}`),
    enabled: !!orgId,
  });
}

export function useOrgMembers(orgId: string | undefined) {
  return useQuery<OrgMember[]>({
    queryKey: ['organization', orgId, 'members'],
    queryFn: () => api.get(`/organizations/${orgId}/members`),
    enabled: !!orgId,
  });
}

export function useOrgInvites(orgId: string | undefined) {
  return useQuery<OrgInvite[]>({
    queryKey: ['organization', orgId, 'invites'],
    queryFn: () => api.get(`/organizations/${orgId}/invites`),
    enabled: !!orgId,
  });
}

export function useOrgAnalytics(orgId: string | undefined) {
  return useQuery<OrgAnalytics>({
    queryKey: ['organization', orgId, 'analytics'],
    queryFn: () => api.get(`/organizations/${orgId}/analytics`),
    enabled: !!orgId,
  });
}

export interface PaginatedLeads {
  items: OrgLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useOrgLeads(orgId: string | undefined, opts: {
  page?: number; search?: string; isRead?: string;
} = {}) {
  const params = new URLSearchParams();
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  if (opts.search) params.set('search', opts.search);
  if (opts.isRead !== undefined) params.set('isRead', opts.isRead);
  const qs = params.toString();

  return useQuery<PaginatedLeads>({
    queryKey: ['organization', orgId, 'leads', opts],
    queryFn: () => api.get(`/organizations/${orgId}/leads${qs ? `?${qs}` : ''}`),
    enabled: !!orgId,
  });
}

// --- Mutations ---

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) => api.post('/organizations', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); },
  });
}

export function useUpdateOrganization(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/organizations/${orgId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization', orgId] });
      qc.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => api.delete(`/organizations/${orgId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organizations'] }); },
  });
}

export function useInviteMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: string }) => api.post(`/organizations/${orgId}/invite`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId, 'invites'] }); },
  });
}

export function useRevokeInvite(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`/organizations/${orgId}/invites/${inviteId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId, 'invites'] }); },
  });
}

export function usePreviewInvite(token: string | undefined) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => api.get(`/organizations/invite/${token}`),
    enabled: !!token,
    retry: 1,
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post(`/organizations/join/${token}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUpdateMemberRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/organizations/${orgId}/members/${memberId}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId, 'members'] }); },
  });
}

export function useRemoveMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/organizations/${orgId}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization', orgId, 'members'] });
      qc.invalidateQueries({ queryKey: ['organization', orgId] });
    },
  });
}

export function useLinkProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.post(`/organizations/${orgId}/profiles/${profileId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId] }); },
  });
}

export function useUnlinkProfile(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.delete(`/organizations/${orgId}/profiles/${profileId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId] }); },
  });
}

export function useBulkApplyBranding(orgId: string) {
  const qc = useQueryClient();
  return useMutation<{ applied: boolean; count: number }>({
    mutationFn: () => api.post(`/organizations/${orgId}/bulk-apply`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId] }); },
  });
}

export function useMarkLeadRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, isRead }: { leadId: string; isRead: boolean }) =>
      api.put(`/organizations/${orgId}/leads/${leadId}/read`, { isRead }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId, 'leads'] }); },
  });
}

export function useMarkAllLeadsRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put(`/organizations/${orgId}/leads/mark-all-read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['organization', orgId, 'leads'] }); },
  });
}
