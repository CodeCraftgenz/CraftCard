import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken, clearAccessToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPaid: boolean;
  paidUntil: string | null;
}

interface AuthContextType extends AuthState {
  login: (googleCredential: string) => Promise<void>;
  devLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasPaid: false,
    paidUntil: null,
  });

  const fetchMe = useCallback(async () => {
    try {
      const data: { user: User; hasPaid: boolean; paidUntil: string | null } = await api.get('/me');
      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        hasPaid: data.hasPaid,
        paidUntil: data.paidUntil,
      });
    } catch {
      setState({ user: null, isAuthenticated: false, isLoading: false, hasPaid: false, paidUntil: null });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      setState({ user: null, isAuthenticated: false, isLoading: false, hasPaid: false, paidUntil: null });
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
      setState({ user: null, isAuthenticated: false, isLoading: false, hasPaid: false, paidUntil: null });
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ ...state, login, devLogin, logout, refreshAuth }}>
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
