import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/organisms/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { EditorPage } from './pages/EditorPage';
import { PublicCardPage } from './pages/PublicCardPage';
import { BillingSuccessPage } from './pages/BillingSuccessPage';
import { OrgDashboardPage } from './pages/OrgDashboardPage';
import { OrgJoinPage } from './pages/OrgJoinPage';
import { WidgetPage } from './pages/WidgetPage';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <HelmetProvider>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/editor"
                element={
                  <ProtectedRoute>
                    <EditorPage />
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
              <Route path="/widget/:slug" element={<WidgetPage />} />
              {/* Public card page - catch-all must be last */}
              <Route path="/:slug" element={<PublicCardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}
