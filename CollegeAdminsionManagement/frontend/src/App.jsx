import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ReportsPage from './pages/ReportsPage';
import ChatPage from './pages/ChatPage';
import ApplicationForm from './pages/ApplicationForm';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'STUDENT': return '/student/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      case 'SUPER_ADMIN': return '/super-admin/dashboard';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <RegisterPage />
      } />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/apply" element={
        <ProtectedRoute roles={['STUDENT']}><ApplicationForm /></ProtectedRoute>
      } />
      <Route path="/student/applications/edit/:id" element={
        <ProtectedRoute roles={['STUDENT']}><ApplicationForm /></ProtectedRoute>
      } />
      <Route path="/student/chat" element={
        <ProtectedRoute roles={['STUDENT']}><ChatPage /></ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/applications/edit/:id" element={
        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><ApplicationForm /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><ReportsPage /></ProtectedRoute>
      } />
      <Route path="/admin/chat" element={
        <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}><ChatPage /></ProtectedRoute>
      } />

      {/* Super Admin Routes */}
      <Route path="/super-admin/dashboard" element={
        <ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

export default App;
