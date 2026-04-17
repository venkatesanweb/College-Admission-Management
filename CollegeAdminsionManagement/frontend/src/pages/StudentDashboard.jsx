import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiPlus, FiBell, FiLogOut, FiCalendar, FiMessageSquare, FiUpload, FiEye, FiBookOpen, FiCornerUpRight, FiTrash2 } from 'react-icons/fi';
import ApplicationDetailModal from '../components/ApplicationDetailModal';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [bookingModal, setBookingModal] = useState(null); // { slot, mode: 'book' | 'reschedule' }
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchApplications();
    if (activeTab === 'courses') fetchCourses();
    if (activeTab === 'slots') {
      fetchSlots();
      fetchMyBookings();
    }
    fetchUnreadCount();
  }, [activeTab, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/student/applications?page=${page}&size=5`);
      setApplications(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch (err) { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await API.get('/student/slots');
      setSlots(res.data.data);
    } catch (err) { toast.error('Failed to load available slots'); }
    finally { setLoading(false); }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await API.get('/student/slots/my-bookings');
      setMyBookings(res.data.data);
    } catch (err) { /* silent */ }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/courses');
      setCourses(res.data.data);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get('/student/notifications/unread-count');
      setUnreadCount(res.data.data);
    } catch (err) { /* silent */ }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/student/notifications');
      setNotifications(res.data.data);
    } catch (err) { /* silent */ }
  };

  const bookSlot = async (e) => {
    e.preventDefault();
    if (!selectedTime) return toast.error('Please select a time window');
    try {
      await API.post(`/student/slots/${bookingModal.slot.id}/book?appointmentTime=${selectedTime}`);
      toast.success('Verification slot booked successfully!');
      setBookingModal(null);
      setSelectedTime('');
      fetchSlots();
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  const rescheduleSlot = async (e) => {
    e.preventDefault();
    if (!selectedTime) return toast.error('Please select a time window');
    try {
      await API.patch(`/student/slots/${bookingModal.slot.id}/reschedule?newTime=${selectedTime}`);
      toast.success('Verification slot rescheduled successfully!');
      setBookingModal(null);
      setSelectedTime('');
      fetchSlots();
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    }
  };

  const cancelSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This counts as 1 change attempt.')) return;
    try {
      await API.delete(`/student/slots/${slotId}/cancel`);
      toast.success('Booking cancelled');
      fetchSlots();
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const generateTimeWindows = (start, end) => {
    const windows = [];
    let current = new Date(start);
    const endTime = new Date(end);
    
    // Round to nearest 10 min
    current.setSeconds(0, 0);
    const mins = current.getMinutes();
    current.setMinutes(Math.ceil(mins / 10) * 10);

    while (current < endTime) {
      windows.push(new Date(current));
      current.setMinutes(current.getMinutes() + 10);
    }
    return windows;
  };

  // Helper to format LocalDateTime for API
  const formatForAPI = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  };

  const toggleNotifications = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  const markAllRead = async () => {
    try {
      await API.patch('/student/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { /* silent */ }
  };

  const handleFileUpload = async (applicationId) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      await API.post(`/student/applications/${applicationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded!');
      setUploadModal(null);
      setSelectedFile(null);
      fetchApplications();
    } catch (err) { toast.error('Upload failed'); }
  };

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    return <span className={`badge badge-${s}`}>{status.replace('_', ' ')}</span>;
  };

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === 'SUBMITTED').length,
    accepted: applications.filter(a => a.status === 'ACCEPTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>🎓 Admission Portal</h2><p>Student Panel</p></div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link${activeTab === 'dashboard' ? ' active' : ''}`} onClick={() => setActiveTab('dashboard')}><FiFileText /> Dashboard</button>
          <Link to="/student/apply" className="sidebar-link"><FiPlus /> New Application</Link>
          <button className={`sidebar-link${activeTab === 'courses' ? ' active' : ''}`} onClick={() => setActiveTab('courses')}><FiBookOpen /> Courses</button>
          <button className={`sidebar-link${activeTab === 'slots' ? ' active' : ''}`} onClick={() => setActiveTab('slots')}><FiCalendar /> Slots</button>
          {applications.length > 0 && <Link to="/student/chat" className="sidebar-link"><FiMessageSquare /> Chat</Link>}
        </nav>
        <div className="sidebar-footer">
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullName}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <button className="sidebar-link" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">
            {activeTab === 'dashboard' && 'Student Dashboard'}
            {activeTab === 'courses' && 'Colleges & Programs'}
            {activeTab === 'slots' && 'Verification Slots'}
          </h1>
          <div className="topbar-actions">
            <div className="notification-badge" style={{ position: 'relative' }}>
              <button className="btn btn-ghost" onClick={toggleNotifications}>
                <FiBell size={20} />
                {unreadCount > 0 && <span className="count">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                        <h4>{n.title}</h4>
                        <p>{n.message}</p>
                        <span className="time">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon primary"><FiFileText /></div><div className="stat-info"><h3>{stats.total}</h3><p>Total Applications</p></div></div>
                <div className="stat-card"><div className="stat-icon info"><FiClock /></div><div className="stat-info"><h3>{stats.submitted}</h3><p>Pending Review</p></div></div>
                <div className="stat-card"><div className="stat-icon success"><FiCheckCircle /></div><div className="stat-info"><h3>{stats.accepted}</h3><p>Accepted</p></div></div>
                <div className="stat-card"><div className="stat-icon danger"><FiXCircle /></div><div className="stat-info"><h3>{stats.rejected}</h3><p>Rejected</p></div></div>
              </div>

              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-header"><div><h2 className="card-title">My Applications</h2><p className="card-subtitle">Track your admission applications</p></div><Link to="/student/apply" className="btn btn-primary"><FiPlus /> New Application</Link></div>
                {loading ? ( <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div> ) : applications.length === 0 ? (
                  <div className="empty-state"><FiFileText size={48} /><h3>No Applications Yet</h3><p>Submit your first application to get started</p><Link to="/student/apply" className="btn btn-primary" style={{ marginTop: 16 }}>Apply Now</Link></div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>ID</th><th>Course</th><th>Marks</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app.id}>
                            <td>#{app.id}</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{app.courseName}</td>
                            <td>{app.marks}%</td>
                            <td>{getStatusBadge(app.status)}</td>
                            <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal(app)} title="View Detail"><FiEye size={18} /></button>
                                {(!app.editCount || app.editCount < 3) ? (
                                  <Link to={`/student/applications/edit/${app.id}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-primary)' }}>Edit ({3 - (app.editCount || 0)} left)</Link>
                                ) : ( <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Edits Exhausted</span> )}
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
                    {[...Array(totalPages)].map((_, i) => ( <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button> ))}
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'slots' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* My Booking Section */}
              {myBookings.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--success)', background: 'var(--success-bg, #f0fdf4)' }}>
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">My Verification Appointment</h2>
                      <p className="card-subtitle">You have confirmed your spot</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: myBookings[0].slotActionAttempts >= 3 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        Changes used: {myBookings[0].slotActionAttempts}/3
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
                        <FiClock style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        {new Date(myBookings[0].appointmentTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        <strong>Slot:</strong> {myBookings[0].title} {myBookings[0].courseName && `(${myBookings[0].courseName})`}
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                        {myBookings[0].slotActionAttempts < 3 && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => setBookingModal({ slot: myBookings[0], mode: 'reschedule' })}>
                              <FiCornerUpRight /> Reschedule
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => cancelSlot(myBookings[0].id)}>
                              <FiTrash2 /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Note: Verification is strictly 10 minutes. Please arrive 5 minutes early. 
                      You can reschedule or cancel up to 3 times total.
                    </p>
                  </div>
                </div>
              )}

              {/* Available Slots Grid */}
              <div className="card">
                <div className="card-header">
                  <div><h2 className="card-title">Available Slots</h2><p className="card-subtitle">Select a slot to see available 10-minute windows</p></div>
                </div>
                {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div> : 
                 slots.length === 0 ? <div className="empty-state"><FiCalendar size={48} /><h3>No Slots Available</h3></div> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {slots.map(slot => (
                      <div key={slot.id} className="card" style={{ padding: 24, transition: 'transform 0.2s', cursor: 'default' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{slot.title}</h4>
                        {slot.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{slot.description}</p>}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                          <FiClock size={14} style={{ marginRight: 6 }} /> {new Date(slot.startTime).toLocaleDateString()}
                          <br />
                          <span style={{ marginLeft: 20 }}>{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Bookings: {slot.bookedCount}</span>
                          {slot.bookedByCurrentUser ? (
                            <span className="badge badge-accepted">✓ Booked</span>
                          ) : (myBookings.length > 0) ? (
                            <button className="btn btn-secondary btn-sm" disabled>Already Booked</button>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => { setBookingModal({ slot, mode: 'book' }); setSelectedTime(''); }}>Book Window</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {courses.map(c => {
                const appliedApp = applications.find(a => a.courseName === c.name);
                return (
                  <div key={c.id} className="card" style={{ padding: 24, borderLeft: `4px solid ${appliedApp ? 'var(--success)' : 'var(--accent-primary)'}` }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.collegeName}</div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', margin: '4px 0' }}>{c.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available Seats: {c.availableSeats} / {c.totalSeats}</p>
                    {appliedApp ? <span className="badge badge-accepted" style={{ marginTop: 12 }}>✓ Applied</span> : <Link to="/student/apply" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Apply Now</Link>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Booking / Reschedule Modal */}
      {bookingModal && (
        <div className="modal-overlay" onClick={() => setBookingModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{bookingModal.mode === 'book' ? 'Select Verification Time' : 'Reschedule Verification'}</h2>
              <button className="modal-close" onClick={() => setBookingModal(null)}>×</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Slot: <strong>{bookingModal.slot.title}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Range: {new Date(bookingModal.slot.startTime).toLocaleTimeString()} - {new Date(bookingModal.slot.endTime).toLocaleTimeString()}
              </p>
            </div>

            <form onSubmit={bookingModal.mode === 'book' ? bookSlot : rescheduleSlot}>
              <div className="form-group">
                <label className="form-label">Available 10-Minute Windows</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, maxHeight: 300, overflowY: 'auto', padding: 4 }}>
                  {generateTimeWindows(bookingModal.slot.startTime, bookingModal.slot.endTime).map(time => {
                    const val = formatForAPI(time);
                    const label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    // Check if time is past or already booked
                    const isPast = time < new Date();
                    // const isBooked = bookingModal.slot.bookedTimes?.some(bt => new Date(bt).getTime() === time.getTime());
                    
                    // if (isBooked) return null; // Only show available timings

                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={isPast}
                        className={`btn btn-sm ${selectedTime === val ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ border: '1px solid var(--border-color)' }}
                        onClick={() => setSelectedTime(val)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!selectedTime}>
                  {bookingModal.mode === 'book' ? 'Confirm Booking' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailModal && <ApplicationDetailModal detailModal={detailModal} setDetailModal={setDetailModal} />}
    </div>
  );
};

export default StudentDashboard;
