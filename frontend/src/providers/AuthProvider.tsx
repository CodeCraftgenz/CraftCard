import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface CardSummary {
  id: string;
  label: string;
  slug: string;
  isPrimary: boolean;
  displayName: string;
}

export interface OrgMembership {
  id: string;
  name: string;
  slug: string;
  brandingActive: boolean;
  role: string;
}

export type PlanType = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanLimits {
  maxCards: number;
  maxLinks: number;
  maxThemes: number | 'all';
  canPublish: boolean;
  analytics: boolean;
  gallery: boolean;
  bookings: boolean;
  testimonials: boolean;
  contacts: boolean;
  services: boolean;
  faq: boolean;
  resume: boolean;
  video: boolean;
  watermark: boolean;
  customFonts: boolean;
  customBg: boolean;
  leadsExport: boolean;
  orgDashboard: boolean;
  branding: boolean;
  customDomain: boolean;
  webhooks: boolean;
}

const DEFAULT_LIMITS: PlanLimits = {
  maxCards: 1, maxLinks: 5, maxThemes: 3, canPublish: true,
  analytics: false, gallery: false, bookings: false, testimonials: false,
  contacts: false, services: false, faq: false, resume: false, video: false,
  watermark: true, customFonts: false, customBg: false, leadsExport: false,
  orgDashboard: false, branding: false, customDomain: false, webhooks: false,
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasPaid: boolean;
  paidUntil: string | null;
  cards: CardSummary[];
  plan: PlanType;
  planLimits: PlanLimits;
  organizations: OrgMembership[];
}

interface AuthContextType extends AuthState {
  login: (googleCredential: string) => Promise<void>;
  devLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasFeature: (feature: keyof PlanLimits) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMPTY_STATE: AuthState = {
  user: null, isAuthenticated: false, isLoading: false, isAdmin: false,
  hasPaid: false, paidUntil: null, cards: [],
  plan: 'FREE', planLimits: DEFAULT_LIMITS, organizations: [],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...EMPTY_STATE,
    isLoading: true,
  });

  const fetchMe = useCallback(async () => {
    try {
      const data: {
        user: User;
        hasPaid: boolean;
        paidUntil: string | null;
        cards: CardSummary[];
        plan?: PlanType;
        planLimits?: PlanLimits;
        organizations?: OrgMembership[];
      } = await api.get('/me');
      const role = data.user.role || 'USER';
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: role === 'SUPER_ADMIN',
        hasPaid: data.hasPaid,
        paidUntil: data.paidUntil,
        cards: data.cards || [],
        plan: data.plan || (data.hasPaid ? 'PRO' : 'FREE'),
        planLimits: data.planLimits || DEFAULT_LIMITS,
        organizations: data.organizations || [],
      });
    } catch {
      setState(EMPTY_STATE);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      setState(EMPTY_STATE);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (googleCredential: string) => {
    const data: { user: User; accessToken: string } = await api.post('/auth/google', {
      credential: googleCredential,
    });
    setAccessToken(data.accessToken);
    await fetchMe();
  }, [fetchMe]);

  const devLogin = useCallback(async (email?: string, name?: string) => {
    const data: { user: User; accessToken: string } = await api.post('/auth/dev', { email, name });
    setAccessToken(data.accessToken);
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setState(EMPTY_STATE);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const hasFeature = useCallback((feature: keyof PlanLimits): boolean => {
    const value = state.planLimits[feature];
    if (typeof value === 'boolean') return value;
    return true;
  }, [state.planLimits]);

  return (
    <AuthContext.Provider value={{ ...state, login, devLogin, logout, refreshAuth, hasFeature }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
