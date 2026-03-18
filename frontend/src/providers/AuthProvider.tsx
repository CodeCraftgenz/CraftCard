/**
 * AuthProvider.tsx — Gerenciamento centralizado de autenticacao e sessao.
 *
 * Responsabilidades:
 * - Manter estado do usuario autenticado (dados, plano, permissoes, cartoes)
 * - Prover metodos de login (Google OAuth, email/senha, dev mode), registro e logout
 * - Verificar limites de features baseado no plano (FREE, PRO, BUSINESS, ENTERPRISE)
 * - Integrar com o sistema de organizacoes (memberships)
 *
 * O estado e restaurado automaticamente ao carregar a pagina via GET /me,
 * que valida o token JWT armazenado em cookie httpOnly.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken } from '@/lib/api';
import { queryClient } from '@/providers/QueryProvider';

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
  coverUrl: string | null;
  backgroundImageUrl: string | null;
  role: string;
}

/** Tipos de plano disponiveis — definem os limites de recursos do usuario */
export type PlanType = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

/** Mapa de limites por feature. Cada plano tem valores diferentes retornados pelo backend */
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

// Limites padrao do plano FREE — usados como fallback caso o backend nao retorne planLimits.
// watermark: true significa que o selo "Feito com CraftCard" sera exibido no cartao.
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
  isHackathonParticipant: boolean;
}

interface RegisterData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  inviteToken?: string;
}

interface RegisterResult {
  joinedOrg?: { id: string; name: string; slug: string };
}

interface AuthContextType extends AuthState {
  login: (googleCredential: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
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
  isHackathonParticipant: false,
};

/**
 * Provider principal de autenticacao. Envolve toda a arvore de componentes
 * e disponibiliza o estado de auth via useAuth().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicia com isLoading: true pois precisamos verificar sessao existente via /me
  const [state, setState] = useState<AuthState>({
    ...EMPTY_STATE,
    isLoading: true,
  });

  /**
   * Busca dados do usuario autenticado no backend (GET /me).
   * Chamado no mount inicial e apos cada login/registro para sincronizar estado.
   * Se falhar (401), reseta para estado vazio (usuario deslogado).
   */
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
        isHackathonParticipant?: boolean;
      } = await api.get('/me');
      const role = data.user.role || 'USER';
      // Fallback: se backend antigo nao retorna plan, infere a partir de hasPaid
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
        isHackathonParticipant: data.isHackathonParticipant || false,
      });
    } catch {
      setState(EMPTY_STATE);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Listener global para evento de logout forcado (disparado pelo interceptor de API
  // quando o refresh token falha). Limpa estado local sem chamar o backend.
  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      // Remove apenas queries privadas — preserva caches de perfis publicos
      // para evitar flash de loading em paginas de cartao abertas
      queryClient.removeQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return firstKey !== 'public-profile' && firstKey !== 'hackathon-profile';
        },
      });
      setState(EMPTY_STATE);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /** Login via Google OAuth — envia o credential JWT do Google para o backend */
  const login = useCallback(async (googleCredential: string) => {
    const data: { user: User; accessToken: string } = await api.post('/auth/google', {
      credential: googleCredential,
    });
    setAccessToken(data.accessToken);
    queryClient.clear();
    await fetchMe();
  }, [fetchMe]);

  /** Login tradicional via email + senha */
  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const data: { user: User; accessToken: string } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    queryClient.clear();
    await fetchMe();
  }, [fetchMe]);

  /** Registro de novo usuario. Pode incluir inviteToken para entrar automaticamente em uma org */
  const register = useCallback(async (registerData: RegisterData): Promise<RegisterResult> => {
    const data: { user: User; accessToken: string; joinedOrg?: { id: string; name: string; slug: string } } =
      await api.post('/auth/register', registerData);
    setAccessToken(data.accessToken);
    queryClient.clear();
    await fetchMe();
    return { joinedOrg: data.joinedOrg };
  }, [fetchMe]);

  /** Login de desenvolvimento — disponivel apenas em ambiente nao-producao */
  const devLogin = useCallback(async (email?: string, name?: string) => {
    const data: { user: User; accessToken: string } = await api.post('/auth/dev', { email, name });
    setAccessToken(data.accessToken);
    queryClient.clear();
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      queryClient.clear();
      setState(EMPTY_STATE);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  /**
   * Verifica se o plano atual permite acesso a uma feature especifica.
   * Para limites booleanos retorna o valor direto; para numericos (maxCards etc.) retorna true.
   * Usado por componentes como FeatureLock para mostrar paywall.
   */
  const hasFeature = useCallback((feature: keyof PlanLimits): boolean => {
    const value = state.planLimits[feature];
    if (typeof value === 'boolean') return value;
    return true;
  }, [state.planLimits]);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithPassword, register, devLogin, logout, refreshAuth, hasFeature }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para acessar o contexto de autenticacao. Deve ser usado dentro de <AuthProvider> */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
