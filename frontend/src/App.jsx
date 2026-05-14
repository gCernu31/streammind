import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';
import MemoryPage from './pages/MemoryPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import AnalisiPage from './pages/AnalisiPage.jsx';
import GuidePage from './pages/GuidePage.jsx';
import ChangelogPage from './pages/ChangelogPage.jsx';
import Layout from './components/Layout.jsx';
import { getToken, setToken, clearToken } from './utils/auth.js';

// Disabilita la scroll restoration del browser e torna sempre in cima ad ogni rotta
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Legge token da URL dopo callback OAuth oppure da cookie
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Decodifica JWT lato client (solo per UI, la validazione è nel backend)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        clearToken();
      } else {
        setUser(payload);
      }
    } catch {
      clearToken();
    }
    setLoading(false);
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return { user, loading, logout };
}

function ProtectedRoute({ user, loading, children }) {
  if (loading) return <div className="min-h-screen bg-hally-bg flex items-center justify-center"><span className="text-hally-text-muted">Caricamento...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/analisi"   element={<AnalisiPage   user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
        <Route path="/changelog" element={<ChangelogPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />

        {/* Rotte protette con Layout (sidebar + navbar) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={auth.user} loading={auth.loading}>
              <Layout user={auth.user} onLogout={auth.logout}>
                <DashboardPage user={auth.user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/config"
          element={
            <ProtectedRoute user={auth.user} loading={auth.loading}>
              <Layout user={auth.user} onLogout={auth.logout}>
                <ConfigPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/memory"
          element={
            <ProtectedRoute user={auth.user} loading={auth.loading}>
              <Layout user={auth.user} onLogout={auth.logout}>
                <MemoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute user={auth.user} loading={auth.loading}>
              <Layout user={auth.user} onLogout={auth.logout}>
                <SubscriptionPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/guide"
          element={
            <ProtectedRoute user={auth.user} loading={auth.loading}>
              <Layout user={auth.user} onLogout={auth.logout}>
                <GuidePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
