import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="unauthorized-page">
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        You don't have permission to access this page.
      </p>
      <Link to="/" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
};

export default UnauthorizedPage;
