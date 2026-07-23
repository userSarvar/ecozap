import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RequireAuth, RequireAdmin } from './components/RouteGuards';
import Layout from './components/Layout';
import Login from './pages/Login';
import Parts from './pages/Parts';
import AdminExport from './pages/AdminExport';
import History from './pages/History';
import AdminViewers from './pages/AdminViewers';

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/parts" replace />} />

        {/* Shared read pages (both admin and viewer) */}
        <Route path="parts" element={<Parts />} />
        <Route path="history" element={<History />} />

        {/* Admin-only pages */}
        <Route
          path="export"
          element={
            <RequireAdmin>
              <AdminExport />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/viewers"
          element={
            <RequireAdmin>
              <AdminViewers />
            </RequireAdmin>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
