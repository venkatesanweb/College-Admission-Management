import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiDownload, FiBarChart2, FiLogOut, FiUsers, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];

const ReportsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [perCourse, setPerCourse] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [courseBreakdown, setCourseBreakdown] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAllReports(); }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [summaryRes, courseRes, statusRes, monthlyRes, breakdownRes] = await Promise.all([
        API.get('/reports/summary'),
        API.get('/reports/per-course'),
        API.get('/reports/status-distribution'),
        API.get('/reports/monthly-trends'),
        API.get('/reports/course-breakdown'),
      ]);

      setSummary(summaryRes.data.data);
      setPerCourse(Object.entries(courseRes.data.data).map(([name, count]) => ({ name, count })));
      setStatusDist(Object.entries(statusRes.data.data).map(([name, value]) => ({ name: name.replace('_', ' '), value })));
      setMonthlyTrends(monthlyRes.data.data.map(d => ({ name: `${d.month}/${d.year}`, count: d.count })));
      setCourseBreakdown(breakdownRes.data.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally { setLoading(false); }
  };

  const downloadCsv = async () => {
    try {
      const res = await API.get('/reports/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'admission_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch (err) { toast.error('Download failed'); }
  };

  const downloadPdf = async () => {
    try {
      const res = await API.get('/reports/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'admission_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded!');
    } catch (err) { toast.error('Download failed'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading reports...</p></div>;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>🎓 Admission Portal</h2><p>Reports & Analytics</p></div>
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className="sidebar-link"><FiArrowLeft /> Back to Dashboard</Link>
          <div className="sidebar-link active"><FiBarChart2 /> Reports</div>
          <Link to="/admin/chat" className="sidebar-link"><FiMessageSquare /> Chat</Link>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">Reports & Analytics</h1>
          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={downloadCsv}><FiDownload /> CSV</button>
            <button className="btn btn-primary btn-sm" onClick={downloadPdf}><FiDownload /> PDF</button>
          </div>
        </header>

        <div className="page-content">
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon primary"><FiUsers /></div>
              <div className="stat-info"><h3>{summary.total || 0}</h3><p>Total Applications</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon info"><FiBarChart2 /></div>
              <div className="stat-info"><h3>{summary.submitted || 0}</h3><p>Submitted</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success"><FiBarChart2 /></div>
              <div className="stat-info"><h3>{summary.accepted || 0}</h3><p>Accepted</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><FiBarChart2 /></div>
              <div className="stat-info"><h3>{summary.rejected || 0}</h3><p>Rejected</p></div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Applications per Course */}
            <div className="chart-card">
              <h3>Applications per Course</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={perCourse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="chart-card">
              <h3>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusDist.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
              <h3>Monthly Application Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Course Breakdown Table */}
          <div className="card">
            <div className="card-header"><h2 className="card-title">Course-wise Status Breakdown</h2></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Course</th><th>Submitted</th><th>Under Review</th><th>Accepted</th><th>Rejected</th><th>Total</th></tr></thead>
                <tbody>
                  {Object.entries(courseBreakdown).map(([course, statuses]) => {
                    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={course}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{course}</td>
                        <td>{statuses.SUBMITTED || 0}</td>
                        <td>{statuses.UNDER_REVIEW || 0}</td>
                        <td style={{ color: 'var(--success)' }}>{statuses.ACCEPTED || 0}</td>
                        <td style={{ color: 'var(--danger)' }}>{statuses.REJECTED || 0}</td>
                        <td style={{ fontWeight: 600 }}>{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
