import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute, HackathonGuard } from './components/organisms/ProtectedRoute';
import { AdminRoute } from './components/organisms/AdminRoute';
import { ErrorBoundary } from './components/atoms/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PublicCardPage } from './pages/PublicCardPage';
import { NotFound } from './pages/NotFound';
import { SupportChat } from './components/organisms/SupportChat';
import { useAuth } from './providers/AuthProvider';

// Lazy-loaded pages (authenticated / heavy)
const EditorPage = lazy(() => import('./pages/EditorPage').then(m => ({ default: m.EditorPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const BillingSuccessPage = lazy(() => import('./pages/BillingSuccessPage').then(m => ({ default: m.BillingSuccessPage })));
const OrgDashboardPage = lazy(() => import('./pages/OrgDashboardPage').then(m => ({ default: m.OrgDashboardPage })));
const OrgJoinPage = lazy(() => import('./pages/OrgJoinPage').then(m => ({ default: m.OrgJoinPage })));
const TutorialPage = lazy(() => import('./pages/TutorialPage').then(m => ({ default: m.TutorialPage })));
const WidgetPage = lazy(() => import('./pages/WidgetPage').then(m => ({ default: m.WidgetPage })));
const WebhooksPage = lazy(() => import('./pages/WebhooksPage').then(m => ({ default: m.WebhooksPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'));
const HackathonOnboarding = lazy(() => import('./hackathon/HackathonOnboarding'));
const HackathonPublicCard = lazy(() => import('./hackathon/HackathonPublicCard'));
const HackathonDashboard = lazy(() => import('./hackathon/HackathonDashboard'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
    </div>
  );
}

const APP_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/billing', '/editor', '/tutorial', '/admin', '/org', '/hackathon', '/webhooks', '/connections', '/privacy', '/widget'];

function SupportChatGlobal() {
  const { isAuthenticated, plan } = useAuth();
  const { pathname } = useLocation();
  const isPaid = plan !== 'FREE';
  // Only show on known app paths (not on public card /:slug pages)
  const isAppPath = pathname === '/' || APP_PATHS.some((p) => p !== '/' && pathname.startsWith(p));
  if (!isAppPath) return null;
  if (!isAuthenticated) return <SupportChat />;
  if (isPaid) return <SupportChat premium />;
  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <SupportChatGlobal />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route
                    path="/editor"
                    element={
                      <ProtectedRoute>
                        <HackathonGuard>
                          <EditorPage />
                        </HackathonGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/billing/success"
                    element={
                      <ProtectedRoute>
                        <BillingSuccessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tutorial"
                    element={
                      <ProtectedRoute>
                        <TutorialPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute>
                        <BillingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/webhooks"
                    element={
                      <ProtectedRoute>
                        <WebhooksPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/connections"
                    element={
                      <ProtectedRoute>
                        <ConnectionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/org/:orgId"
                    element={
                      <ProtectedRoute>
                        <OrgDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/org/join/:token"
                    element={
                      <ProtectedRoute>
                        <OrgJoinPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="/hackathon" element={<HackathonOnboarding />} />
                  <Route
                    path="/hackathon/dashboard"
                    element={
                      <ProtectedRoute>
                        <HackathonDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/hackathon/card/:slug" element={<HackathonPublicCard />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/widget/:slug" element={<WidgetPage />} />
                  {/* Public card page - catch-all must be last */}
                  <Route path="/:slug" element={<PublicCardPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </QueryProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
