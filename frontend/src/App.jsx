import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';
import MemoryPage from './pages/MemoryPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';
import AnalisiPage from './pages/AnalisiPage.jsx';
import GuidePage from './pages/GuidePage.jsx';
import ChangelogPage from './pages/ChangelogPage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import RefPage from './pages/RefPage.jsx';
import StatusPage from './pages/StatusPage.jsx';
import Layout from './components/Layout.jsx';
import { getToken, setToken, clearToken } from './utils/auth.js';

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
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      localStorage.removeItem('streammindai_ref');
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = getToken();
    if (!token) { setLoading(false); return; }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) clearToken();
      else setUser(payload);
    } catch { clearToken(); }
    setLoading(false);
  }, []);

  const logout = () => { clearToken(); setUser(null); };
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
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/analisi"   element={<AnalisiPage   user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/changelog" element={<ChangelogPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/status"    element={<StatusPage    user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/faq"       element={<FaqPage       user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/ref/:code" element={<RefPage />} />

          {/* Rotte protette */}
          <Route path="/dashboard"   element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><DashboardPage user={auth.user} /></Layout></ProtectedRoute>} />
          <Route path="/config"      element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><ConfigPage /></Layout></ProtectedRoute>} />
          <Route path="/memory"      element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><MemoryPage /></Layout></ProtectedRoute>} />
          <Route path="/subscription"element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><SubscriptionPage /></Layout></ProtectedRoute>} />
          <Route path="/guide"       element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><GuidePage /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
