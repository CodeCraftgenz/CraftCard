import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- Types ---

export interface DashboardStats {
  totalUsers: number;
  totalProfiles: number;
  totalOrgs: number;
  usersByPlan: Record<string, number>;
  newUsersLast30Days: { date: string; count: number }[];
  revenue: { total: number; last30Days: number };
  totalViews: number;
  totalMessages: number;
  conversionRate: number;
  expiringSubscriptions: number;
  revenueLast30Days: { date: string; amount: number }[];
  topProfiles: { displayName: string; slug: string; viewCount: number }[];
  featureAdoption: {
    published: { count: number; pct: number };
    leadCapture: { count: number; pct: number };
    booking: { count: number; pct: number };
  };
  deviceDistribution: { device: string; count: number }[];
  recentLeads: {
    id: string;
    senderName: string;
    senderEmail: string | null;
    createdAt: string;
    profile: { displayName: string; slug: string };
  }[];
  recentActivity: { type: 'signup' | 'payment' | 'message'; label: string; date: string }[];
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
  role: string;
  createdAt: string;
  _count: { profiles: number; orgMemberships: number };
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
  role: string;
  createdAt: string;
  profiles: { id: string; displayName: string; slug: string; isPrimary: boolean; viewCount: number }[];
  payments: { id: string; amount: number; status: string; plan: string | null; paidAt: string | null; expiresAt: string | null; createdAt: string }[];
  orgMemberships: { id: string; role: string; org: { id: string; name: string; slug: string } }[];
}

export interface AdminPayment {
  id: string;
  amount: number;
  status: string;
  plan: string | null;
  payerEmail: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  maxMembers: number;
  extraSeats: number;
  createdAt: string;
  _count: { members: number; profiles: number };
}

export interface AdminOrgDetail {
  id: string;
  name: string;
  slug: string;
  maxMembers: number;
  extraSeats: number;
  brandingActive: boolean;
  createdAt: string;
  _count: { members: number; profiles: number };
  members: Array<{ user: { id: string; name: string; email: string }; role: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Queries ---

export function useAdminDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard'),
  });
}

export function useAdminUsers(search: string, plan: string, role: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (plan) params.set('plan', plan);
  if (role) params.set('role', role);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();

  return useQuery<PaginatedResponse<AdminUser>>({
    queryKey: ['admin', 'users', search, plan, role, page],
    queryFn: () => api.get(`/admin/users${qs ? `?${qs}` : ''}`),
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', userId],
    queryFn: () => api.get(`/admin/users/${userId}`),
    enabled: !!userId,
  });
}

export function useAdminPayments(status: string, plan: string, page = 1) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (plan) params.set('plan', plan);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();

  return useQuery<PaginatedResponse<AdminPayment>>({
    queryKey: ['admin', 'payments', status, plan, page],
    queryFn: () => api.get(`/admin/payments${qs ? `?${qs}` : ''}`),
  });
}

export function useAdminOrgs(search: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();

  return useQuery<PaginatedResponse<AdminOrg>>({
    queryKey: ['admin', 'organizations', search, page],
    queryFn: () => api.get(`/admin/organizations${qs ? `?${qs}` : ''}`),
  });
}

// --- Mutations ---

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role?: string; plan?: string } }) =>
      api.put(`/admin/users/${userId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useAdminOrgDetail(orgId: string | null) {
  return useQuery<AdminOrgDetail>({
    queryKey: ['admin', 'organizations', orgId],
    queryFn: () => api.get(`/admin/organizations/${orgId}`),
    enabled: !!orgId,
  });
}

export function useUpdateAdminOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: { extraSeats?: number } }) =>
      api.put(`/admin/organizations/${orgId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    },
  });
}
