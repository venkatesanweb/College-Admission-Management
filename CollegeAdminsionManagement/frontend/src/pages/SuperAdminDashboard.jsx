import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { FiShield, FiUsers, FiActivity, FiLogOut, FiBarChart2, FiMessageSquare, FiLock, FiUnlock, FiTrash2, FiBookOpen, FiPlus, FiEdit } from 'react-icons/fi';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminStep, setAdminStep] = useState(1);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: '', phone: '', otp: '' });
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Course modal state
  const [courseModal, setCourseModal] = useState(null); // null | 'new' | courseId
  const [courseForm, setCourseForm] = useState({ name: '', collegeName: '', description: '', totalSeats: '', duration: '', fees: '' });

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'courses') fetchCourses();
  }, [activeTab, logPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/super-admin/logs?page=${logPage}&size=20`);
      setLogs(res.data.data.content);
      setLogTotalPages(res.data.data.totalPages);
    } catch (err) { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/super-admin/users');
      setUsers(res.data.data);
    } catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/super-admin/courses');
      setCourses(res.data.data);
    } catch (err) { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const blockUser = async (userId) => {
    try {
      await API.patch(`/super-admin/users/${userId}/block`);
      toast.success('User blocked');
      fetchUsers();
    } catch (err) { toast.error('Failed to block user'); }
  };

  const unblockUser = async (userId) => {
    try {
      await API.patch(`/super-admin/users/${userId}/unblock`);
      toast.success('User unblocked');
      fetchUsers();
    } catch (err) { toast.error('Failed to unblock user'); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await API.delete(`/super-admin/users/${userId}`);
      toast.success('Admin deleted successfully');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete user'); }
  };

  const handleSendAdminOtp = async () => {
    if (!newAdmin.email || !newAdmin.fullName || newAdmin.password.length < 6) {
      toast.error('Please fill all required fields correctly');
      return;
    }
    try {
      await API.post('/auth/send-otp', { email: newAdmin.email });
      toast.success('OTP sent to the provided email!');
      setAdminStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      await API.post('/super-admin/users/admin', newAdmin);
      toast.success('Admin user added successfully!');
      setIsAdminModalOpen(false);
      setAdminStep(1);
      setNewAdmin({ fullName: '', email: '', password: '', phone: '', otp: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add Admin');
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...courseForm,
        totalSeats: parseInt(courseForm.totalSeats),
        fees: parseFloat(courseForm.fees || 0),
      };
      if (courseModal === 'new') {
        await API.post('/super-admin/courses', payload);
        toast.success('Course created!');
      } else {
        await API.put(`/super-admin/courses/${courseModal}`, payload);
        toast.success('Course updated!');
      }
      setCourseModal(null);
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save course'); }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await API.delete(`/super-admin/courses/${id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete course'); }
  };

  const openEditCourse = (course) => {
    setCourseForm({
      name: course.name,
      collegeName: course.collegeName || '',
      description: course.description || '',
      totalSeats: course.totalSeats,
      duration: course.duration || '',
      fees: course.fees || '',
    });
    setCourseModal(course.id);
  };

  const openNewCourse = () => {
    setCourseForm({ name: '', collegeName: '', description: '', totalSeats: '', duration: '', fees: '' });
    setCourseModal('new');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>🎓 Admission Portal</h2><p>Super Admin</p></div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}><FiActivity /> Audit Logs</button>
          <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><FiUsers /> User Management</button>
          <button className={`sidebar-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}><FiBookOpen /> Course Management</button>
          <Link to="/admin/dashboard" className="sidebar-link"><FiShield /> Admin Dashboard</Link>
          <Link to="/admin/reports" className="sidebar-link"><FiBarChart2 /> Reports</Link>
          <Link to="/admin/chat" className="sidebar-link"><FiMessageSquare /> Chat</Link>
        </nav>
        <div className="sidebar-footer">
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullName}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Super Admin</p>
          </div>
          <button className="sidebar-link" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">
            {activeTab === 'logs' && 'Audit Logs'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'courses' && 'Course Management'}
          </h1>
        </header>

        <div className="page-content">
          {/* ========== LOGS TAB ========== */}
          {activeTab === 'logs' && (
            <div className="card">
              <div className="card-header">
                <div><h2 className="card-title">System Activity Logs</h2><p className="card-subtitle">Track all actions in the system</p></div>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>Entity</th></tr></thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.userName}</td>
                          <td>
                            <span className={`badge ${log.action.includes('ACCEPTED') ? 'badge-accepted' : log.action.includes('REJECTED') ? 'badge-rejected' : 'badge-submitted'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                          <td>{log.entityType} #{log.entityId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {logTotalPages > 1 && (
                <div className="pagination">
                  <button disabled={logPage === 0} onClick={() => setLogPage(p => p - 1)}>Previous</button>
                  {[...Array(Math.min(logTotalPages, 5))].map((_, i) => (
                    <button key={i} className={logPage === i ? 'active' : ''} onClick={() => setLogPage(i)}>{i + 1}</button>
                  ))}
                  <button disabled={logPage >= logTotalPages - 1} onClick={() => setLogPage(p => p + 1)}>Next</button>
                </div>
              )}
            </div>
          )}

          {/* ========== USERS TAB ========== */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h2 className="card-title">All Users</h2><p className="card-subtitle">{users.length} registered users</p></div>
                <button className="btn btn-primary" onClick={() => setIsAdminModalOpen(true)}>+ Add Admin</button>
              </div>

              {isAdminModalOpen && (
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px', borderRadius: '8px' }}>
                  <h3>Create New Admin</h3>
                  {adminStep === 1 ? (
                    <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" required value={newAdmin.fullName} onChange={e => setNewAdmin({ ...newAdmin, fullName: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" required value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" required minLength={6} value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input className="form-input" value={newAdmin.phone} onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAdminModalOpen(false)}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSendAdminOtp}>Send OTP</button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', maxWidth: '400px' }}>
                      <div className="form-group">
                        <label className="form-label">Enter OTP sent to {newAdmin.email}</label>
                        <input className="form-input" required value={newAdmin.otp || ''} onChange={e => setNewAdmin({ ...newAdmin, otp: e.target.value })} placeholder="6-digit OTP" />
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setAdminStep(1)}>Back</button>
                        <button type="submit" className="btn btn-primary">Verify and Save</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
              ) : (
                <div className="table-container">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by Role:</span>
                    <select className="form-input" style={{ width: '200px', display: 'inline-block' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                      <option value="ALL">All Users</option>
                      <option value="STUDENT">Students</option>
                      <option value="ADMIN">Admins</option>
                      <option value="SUPER_ADMIN">Super Admins</option>
                    </select>
                  </div>
                  <table className="table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.filter(u => roleFilter === 'ALL' || u.role === roleFilter).map(u => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td><span className="badge badge-submitted">{u.role}</span></td>
                          <td>{u.blocked ? <span className="badge badge-rejected">Blocked</span> : <span className="badge badge-accepted">Active</span>}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {u.id !== user.userId && (
                                <>
                                  {u.role === 'ADMIN' && (
                                    <button className="btn btn-danger btn-sm" style={{ backgroundColor: 'var(--danger-color)' }} onClick={() => deleteUser(u.id)}><FiTrash2 /> Delete</button>
                                  )}
                                  {u.blocked ? (
                                    <button className="btn btn-success btn-sm" onClick={() => unblockUser(u.id)}><FiUnlock /> Unblock</button>
                                  ) : (
                                    <button className="btn btn-danger btn-sm" onClick={() => blockUser(u.id)}><FiLock /> Block</button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========== COURSES TAB ========== */}
          {activeTab === 'courses' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Course Management</h2>
                  <p className="card-subtitle">{courses.length} courses &nbsp;<span style={{ fontSize: '0.75rem', color: 'var(--success, #10b981)', fontWeight: 500 }}>✓ Super Admin access</span></p>
                </div>
                <button className="btn btn-primary" onClick={openNewCourse}><FiPlus /> Add Course</button>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr><th>College</th><th>Course</th><th>Duration</th><th>Fees</th><th>Total Seats</th><th>Available</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {courses.map(c => (
                        <tr key={c.id}>
                          <td>{c.collegeName}</td>
                          <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</td>
                          <td>{c.duration || '—'}</td>
                          <td>₹{c.fees || 0}</td>
                          <td>{c.totalSeats}</td>
                          <td><span className={`badge ${c.availableSeats > 0 ? 'badge-accepted' : 'badge-rejected'}`}>{c.availableSeats}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEditCourse(c)}><FiEdit /></button>
                              <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => deleteCourse(c.id)}><FiTrash2 /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {courses.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No courses yet. Click "Add Course" to create one.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===== Course Modal ===== */}
      {courseModal && (
        <div className="modal-overlay" onClick={() => setCourseModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{courseModal === 'new' ? 'Add Course' : 'Edit Course'}</h2>
              <button className="modal-close" onClick={() => setCourseModal(null)}>×</button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">College Name *</label>
                <input className="form-input" value={courseForm.collegeName} onChange={e => setCourseForm({ ...courseForm, collegeName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Program / Course Name *</label>
                <input className="form-input" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Seats *</label>
                  <input type="number" min="1" className="form-input" value={courseForm.totalSeats} onChange={e => setCourseForm({ ...courseForm, totalSeats: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input className="form-input" placeholder="e.g. 4 Years" value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fees (₹)</label>
                <input type="number" min="0" className="form-input" value={courseForm.fees} onChange={e => setCourseForm({ ...courseForm, fees: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCourseModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {courseModal === 'new' ? 'Create Course' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
