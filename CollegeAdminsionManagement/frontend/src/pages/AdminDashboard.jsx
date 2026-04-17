import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { FiUsers, FiCheckCircle, FiXCircle, FiBookOpen, FiCalendar, FiBarChart2, FiLogOut, FiMessageSquare, FiSearch, FiEye, FiPlus, FiClock } from 'react-icons/fi';
import ApplicationDetailModal from '../components/ApplicationDetailModal';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ studentName: '', minMarks: '', maxMarks: '', courseId: '', status: '', search: '', collegeName: '', admissionCategory: '' });

  // Slot modal
  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ title: '', description: '', startTime: '', endTime: '', courseId: '', collegeName: '' });

  // Bookings details modal
  const [bookingDetails, setBookingDetails] = useState(null); // { slot, bookings: [] }

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);

  // Rejection modal
  const [rejectModal, setRejectModal] = useState(null); 
  const [rejectRemarks, setRejectRemarks] = useState('');

  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'slots') { fetchSlots(); fetchCourses(); }
  }, [activeTab, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (filters.studentName) params.append('studentName', filters.studentName);
      if (filters.minMarks) params.append('minMarks', filters.minMarks);
      if (filters.maxMarks) params.append('maxMarks', filters.maxMarks);
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.collegeName) params.append('collegeName', filters.collegeName);
      if (filters.admissionCategory) params.append('admissionCategory', filters.admissionCategory);

      const res = await API.get(`/admin/applications?${params}`);
      setApplications(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await API.get('/admin/courses');
      setCourses(res.data.data);
    } catch (err) { toast.error('Failed to load courses'); }
  };

  const fetchSlots = async () => {
    try {
      const res = await API.get('/admin/slots');
      setSlots(res.data.data);
    } catch (err) { toast.error('Failed to load slots'); }
  };

  const fetchBookingDetails = async (slot) => {
    try {
      const res = await API.get(`/admin/slots/${slot.id}/bookings`);
      setBookingDetails({ slot, bookings: res.data.data });
    } catch (err) {
      toast.error('Failed to load booking details');
    }
  };

  const approveApplication = async (id) => {
    try {
      await API.patch(`/admin/applications/${id}/approve`);
      toast.success('Application approved!');
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectApplication = async (id, remarks) => {
    try {
      const params = remarks ? `?remarks=${encodeURIComponent(remarks)}` : '';
      await API.patch(`/admin/applications/${id}/reject${params}`);
      toast.success('Application rejected');
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openRejectModal = (id) => { setRejectModal(id); setRejectRemarks(''); };

  const confirmReject = async () => {
    await rejectApplication(rejectModal, rejectRemarks);
    setRejectModal(null);
    setRejectRemarks('');
  };

  const handleFilter = () => { setPage(0); fetchApplications(); };

  const clearFilters = () => {
    setFilters({ studentName: '', minMarks: '', maxMarks: '', courseId: '', status: '', search: '', collegeName: '', admissionCategory: '' });
    setPage(0);
    setTimeout(fetchApplications, 0);
  };

  const handleExportCSV = () => {
    if (applications.length === 0) {
      toast.error('No applications to export');
      return;
    }
    const headers = ['ID', 'Student Name', 'Email', 'Course', 'Marks', 'Status', 'Submitted At'];
    const csvRows = [headers.join(',')];
    applications.forEach(app => {
      const row = [app.id, app.studentName, app.studentEmail, app.courseName, app.marks, app.status, new Date(app.submittedAt).toLocaleDateString()].map(e => `"${e}"`).join(',');
      csvRows.push(row);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `applications_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const { collegeName, ...submitData } = slotForm;
      await API.post('/admin/slots', {
        ...submitData,
        courseId: submitData.courseId ? parseInt(submitData.courseId) : null,
      });
      toast.success('Slot created!');
      setSlotModal(false);
      setSlotForm({ title: '', description: '', startTime: '', endTime: '', courseId: '', collegeName: '' });
      fetchSlots();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const getStatusBadge = (s) => <span className={`badge badge-${s.toLowerCase()}`}>{s.replace('_', ' ')}</span>;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>🎓 Admission Portal</h2><p>Admin Panel</p></div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}><FiUsers /> Applications</button>
          <button className={`sidebar-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}><FiBookOpen /> Courses</button>
          <button className={`sidebar-link ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}><FiCalendar /> Slots</button>
          <Link to="/admin/reports" className="sidebar-link"><FiBarChart2 /> Reports</Link>
          <Link to="/admin/chat" className="sidebar-link"><FiMessageSquare /> Chat</Link>
        </nav>
        <div className="sidebar-footer">
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullName}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button className="sidebar-link" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">
            {activeTab === 'applications' && 'Application Management'}
            {activeTab === 'courses' && 'Course Management'}
            {activeTab === 'slots' && 'Slot Management'}
          </h1>
        </header>

        <div className="page-content">
          {activeTab === 'applications' && (
            <>
              <div className="filters-bar">
                <div className="filter-group"><label>Search</label><input placeholder="Name or email..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></div>
                <div className="filter-group"><label>Min Marks</label><input type="number" placeholder="0" value={filters.minMarks} onChange={e => setFilters({ ...filters, minMarks: e.target.value })} style={{ width: 90 }} /></div>
                <div className="filter-group"><label>Max Marks</label><input type="number" placeholder="100" value={filters.maxMarks} onChange={e => setFilters({ ...filters, maxMarks: e.target.value })} style={{ width: 90 }} /></div>
                <div className="filter-group">
                  <label>College</label>
                  <select value={filters.collegeName} onChange={e => setFilters({ ...filters, collegeName: e.target.value })}>
                    <option value="">All</option>
                    {Array.from(new Set(courses.map(c => c.collegeName).filter(Boolean))).map(college => (<option key={college} value={college}>{college}</option>))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Category</label>
                  <select value={filters.admissionCategory} onChange={e => setFilters({ ...filters, admissionCategory: e.target.value })}>
                    <option value="">All</option>
                    <option value="FRESHER">Freshers (12th Pass)</option>
                    <option value="DIPLOMA">Diploma (Lateral Entry)</option>
                    <option value="UG_ADMISSION">UG Admission</option>
                    <option value="PG_ADMISSION">PG Admission</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleFilter}><FiSearch /> Filter</button>
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
                <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={handleExportCSV}>Export CSV</button>
              </div>

              <div className="card">
                <div className="card-header"><p className="card-subtitle">{totalElements} applications found</p></div>
                {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div> : (
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>ID</th><th>Student</th><th>College / Category</th><th>Course</th><th>Marks</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id}>
                            <td>#{app.id}</td>
                            <td><div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{app.studentName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.studentEmail}</div></td>
                            <td><div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{app.collegeName || '—'}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.admissionCategory ? app.admissionCategory.replace('_', ' ') : '—'}</div></td>
                            <td>{app.courseName}</td>
                            <td>{app.marks}%</td>
                            <td>{getStatusBadge(app.status)}</td>
                            <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(app)} title="View"><FiEye /></button>
                                {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
                                  <>
                                    <button className="btn btn-success btn-sm" onClick={() => approveApplication(app.id)} title="Approve"><FiCheckCircle /></button>
                                    <button className="btn btn-danger btn-sm" onClick={() => openRejectModal(app.id)} title="Reject"><FiXCircle /></button>
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
                {totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => (<button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>))}
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'courses' && (
            <div className="card">
              <div className="card-header"><div><h2 className="card-title">Courses</h2><p className="card-subtitle">{courses.length} courses &nbsp;<span style={{ fontSize: '0.75rem', color: 'var(--warning, #f59e0b)', fontWeight: 500 }}>⚠ Course management is restricted to Super Admin only</span></p></div></div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>College</th><th>Course</th><th>Duration</th><th>Fees</th><th>Total Seats</th><th>Available</th></tr></thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id}><td>{c.collegeName}</td><td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</td><td>{c.duration || '—'}</td><td>₹{c.fees || 0}</td><td>{c.totalSeats}</td><td><span className={`badge ${c.availableSeats > 0 ? 'badge-accepted' : 'badge-rejected'}`}>{c.availableSeats}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'slots' && (
            <div className="card">
              <div className="card-header">
                <div><h2 className="card-title">Slots</h2><p className="card-subtitle">{slots.length} slots</p></div>
                <button className="btn btn-primary" onClick={() => setSlotModal(true)}><FiPlus /> Create Slot</button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Title</th><th>Time Range</th><th>Course</th><th>Actions</th></tr></thead>
                  <tbody>
                    {slots.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.title}</td>
                        <td>{new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{s.courseName || 'General'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => fetchBookingDetails(s)} title="View Student Bookings">
                            <FiUsers size={16} style={{ marginRight: 6 }} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Booking Details Modal */}
      {bookingDetails && (
        <div className="modal-overlay" onClick={() => setBookingDetails(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Student Bookings: {bookingDetails.slot.title}</h2>
              <button className="modal-close" onClick={() => setBookingDetails(null)}>×</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Verification windows booked within {new Date(bookingDetails.slot.startTime).toLocaleTimeString()} - {new Date(bookingDetails.slot.endTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="table">
                <thead><tr><th>Student Name</th><th>Email</th><th>Appointment Time</th><th>Booked At</th></tr></thead>
                <tbody>
                  {bookingDetails.bookings.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>No students have booked this slot yet.</td></tr>
                  ) : (
                    bookingDetails.bookings
                      .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
                      .map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 500 }}>{b.studentName}</td>
                          <td>{b.studentEmail}</td>
                          <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                            <FiClock size={14} style={{ marginRight: 6 }} />
                            {new Date(b.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>{new Date(b.bookedAt).toLocaleString()}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setBookingDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {detailModal && <ApplicationDetailModal detailModal={detailModal} setDetailModal={setDetailModal} />}

      {/* Rejection Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h2>Rejection Reason</h2><button className="modal-close" onClick={() => setRejectModal(null)}>×</button></div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>Please provide a reason for rejecting this application.</p>
            <div className="form-group"><label className="form-label">Reason *</label><textarea className="form-textarea" rows={4} value={rejectRemarks} onChange={e => setRejectRemarks(e.target.value)} autoFocus /></div>
            <div style={{ display: 'flex', gap: 12 }}><button className="btn btn-secondary" onClick={() => setRejectModal(null)} style={{ flex: 1 }}>Cancel</button><button className="btn btn-danger" onClick={confirmReject} disabled={!rejectRemarks.trim()} style={{ flex: 1 }}>Confirm Rejection</button></div>
          </div>
        </div>
      )}

      {/* Slot Creation Modal */}
      {slotModal && (
        <div className="modal-overlay" onClick={() => setSlotModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Create Slot</h2><button className="modal-close" onClick={() => setSlotModal(false)}>×</button></div>
            <form onSubmit={handleSaveSlot}>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={slotForm.title} onChange={e => setSlotForm({ ...slotForm, title: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={slotForm.description} onChange={e => setSlotForm({ ...slotForm, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Start Time *</label><input type="datetime-local" className="form-input" value={slotForm.startTime} onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">End Time *</label><input type="datetime-local" className="form-input" value={slotForm.endTime} onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">College (optional)</label>
                  <select className="form-select" value={slotForm.collegeName || ''} onChange={e => setSlotForm({ ...slotForm, collegeName: e.target.value, courseId: '' })}>
                    <option value="">All Colleges</option>
                    {Array.from(new Set(courses.map(c => c.collegeName).filter(Boolean))).map(college => (<option key={college} value={college}>{college}</option>))}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Course (optional)</label>
                  <select className="form-select" value={slotForm.courseId || ''} onChange={e => setSlotForm({ ...slotForm, courseId: e.target.value })}>
                    <option value="">General</option>
                    {courses.filter(c => !slotForm.collegeName || c.collegeName === slotForm.collegeName).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}><button type="button" className="btn btn-secondary" onClick={() => setSlotModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Slot</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
