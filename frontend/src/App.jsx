import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ClientDashboard from './pages/ClientDashboard';
import MechanicDashboard from './pages/MechanicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <p className="loading-text">Loading RoadAid...</p>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'mechanic') return <Navigate to="/mechanic" replace />;
  return <Navigate to="/client" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <RoleRedirect /> : <AuthPage />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/client/*" element={
        <PrivateRoute roles={['client']}>
          <Layout>
            <ClientDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/mechanic/*" element={
        <PrivateRoute roles={['mechanic']}>
          <Layout>
            <MechanicDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/admin/*" element={
        <PrivateRoute roles={['admin']}>
          <Layout>
            <AdminDashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f0ede8',
              border: '1px solid #333',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif"
            },
            success: { iconTheme: { primary: '#2dc653', secondary: '#0a0a0a' } },
            error: { iconTheme: { primary: '#e63946', secondary: '#0a0a0a' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
