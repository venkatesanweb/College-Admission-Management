import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext';

const AuthenticatedDocument = ({ doc }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await API.get(`/documents/${doc.id}/view`, { responseType: 'blob' });
        setUrl(window.URL.createObjectURL(res.data));
      } catch (err) {
        toast.error('Failed to load document: ' + doc.fileName);
      }
    };
    fetchDoc();
  }, [doc.id]);

  if (!url) return <div style={{ padding: 20, textAlign: 'center' }}>Loading {doc.fileName}...</div>;

  const isPdf = doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileType?.includes('pdf');

  return (
    <div className="print-break" style={{ border: '1px solid var(--border-color)', padding: 16, borderRadius: 8, marginBottom: 16, pageBreakInside: 'avoid' }}>
      <h4 style={{ marginBottom: 12 }}>{doc.fileName}</h4>
      {isPdf ? (
         <iframe src={url} style={{ width: '100%', height: '600px', border: '1px solid var(--border-color)', borderRadius: 4 }} title={doc.fileName} />
      ) : (
         <img src={url} alt={doc.fileName} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block', margin: '0 auto', border: '1px solid var(--border-color)', borderRadius: 4 }} />
      )}
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <a href={url} download={doc.fileName} className="btn btn-secondary btn-sm no-print">Download File</a>
      </div>
    </div>
  );
};

const ApplicationDetailModal = ({ detailModal, setDetailModal }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    return <span className={`badge badge-${s}`}>{status.replace('_', ' ')}</span>;
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('application-pdf-content');
    const opt = {
      margin:       10,
      filename:     `Application_${detailModal.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], before: '.print-break', avoid: 'section.card' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="modal-overlay" onClick={() => setDetailModal(null)} style={{ padding: '20px 0' }}>
      <div className="modal print-section" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10, padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0 }}>Application #{detailModal.id}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <button className="btn btn-primary btn-sm no-print" onClick={() => navigate(`/admin/applications/edit/${detailModal.id}`)}>Edit Application</button>
            )}
            <button className="btn btn-secondary btn-sm no-print" onClick={handleDownloadPDF}>Download as PDF</button>
            <button className="btn btn-ghost btn-sm modal-close no-print" style={{ position: 'static' }} onClick={() => setDetailModal(null)}>×</button>
          </div>
        </div>

        <div id="application-pdf-content" style={{ padding: '24px', display: 'grid', gap: '24px' }}>
          {/* Section 1: Basic Details */}
          <section className="card" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>1. Basic Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div><strong>Name:</strong> {detailModal.studentName}</div>
              <div><strong>Email:</strong> {detailModal.studentEmail}</div>
              <div><strong>Course:</strong> {detailModal.courseName}</div>
              <div><strong>Status:</strong> {getStatusBadge(detailModal.status)}</div>
              <div><strong>Gender:</strong> {detailModal.gender || '—'}</div>
              <div><strong>DOB:</strong> {detailModal.dateOfBirth || '—'}</div>
              <div><strong>Age:</strong> {detailModal.age || '—'}</div>
              <div><strong>Mobile:</strong> {detailModal.mobileNumber || '—'}</div>
              <div><strong>Aadhaar:</strong> {detailModal.aadhaarNumber || '—'}</div>
              <div><strong>Religion:</strong> {detailModal.religion || '—'}</div>
              <div><strong>Community:</strong> {detailModal.community || '—'}</div>
              <div><strong>Caste:</strong> {detailModal.caste || '—'}</div>
            </div>
          </section>

          {/* Section 2: Address Details */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>2. Address Details</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div><strong>Permanent Address:</strong><br/>{detailModal.permanentAddressLine}<br/>{detailModal.permanentDistrict}, {detailModal.permanentState} - {detailModal.permanentPincode}</div>
              {!detailModal.isCommunicationSame && (
                <div><strong>Communication Address:</strong><br/>{detailModal.communicationAddressLine}<br/>{detailModal.communicationDistrict}, {detailModal.communicationState} - {detailModal.communicationPincode}</div>
              )}
            </div>
          </section>

          {/* Section 3: Parent/Guardian Details */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>3. Parent/Guardian Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div><strong>Father Name:</strong> {detailModal.fatherName || '—'}</div>
              <div><strong>Mother Name:</strong> {detailModal.motherName || '—'}</div>
              <div><strong>Guardian Name:</strong> {detailModal.guardianName || '—'}</div>
              <div><strong>Occupation:</strong> {detailModal.parentOccupation || '—'}</div>
              <div><strong>Annual Income:</strong> ₹{detailModal.annualIncome || '0'}</div>
              <div><strong>Contact Number:</strong> {detailModal.parentMobileNumber || detailModal.guardianPhone || '—'}</div>
            </div>
          </section>

          {/* Section 4: Academic Details */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>4. Academic Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div><strong>Previous School:</strong> {detailModal.previousSchool || '—'}</div>
              <div><strong>HSC School:</strong> {detailModal.hscSchoolName || '—'}</div>
              <div><strong>HSC Board:</strong> {detailModal.hscBoard || '—'}</div>
              <div><strong>HSC Total Marks:</strong> {detailModal.hscTotalMarks || '—'}</div>
              <div><strong>HSC Cutoff:</strong> {detailModal.hscCutoff || '—'}</div>
              <div><strong>UG Degree:</strong> {detailModal.ugDegree || '—'}</div>
              <div><strong>UG Percetange:</strong> {detailModal.ugPercentage || '—'}%</div>
              <div><strong>PG Degree:</strong> {detailModal.pgDegree || '—'}</div>
              <div><strong>Overall App Marks:</strong> {detailModal.marks}%</div>
            </div>
          </section>

          {/* Section 5: Reservations */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>5. Quotation & Reservation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div><strong>Admission Category:</strong> {detailModal.admissionCategory || '—'}</div>
              <div><strong>First Graduate:</strong> {detailModal.isFirstGraduate ? 'Yes' : 'No'}</div>
              <div><strong>Differently Abled:</strong> {detailModal.isDifferentlyAbled ? 'Yes' : 'No'}</div>
              <div><strong>Sports Quota:</strong> {detailModal.hasSportsQuota ? 'Yes' : 'No'}</div>
              <div><strong>Ex-Serviceman:</strong> {detailModal.isExServiceman ? 'Yes' : 'No'}</div>
            </div>
          </section>

          {/* Section 6: Payment & Others */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>6. Payment & Signatures</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div><strong>Payment Mode:</strong> {detailModal.paymentMode || '—'}</div>
              <div><strong>Transaction ID:</strong> {detailModal.transactionId || '—'}</div>
              <div><strong>Student Signature:</strong> {detailModal.studentSignatureName || '—'}</div>
              <div><strong>Parent Signature:</strong> {detailModal.parentSignatureName || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Personal Statement:</strong><br/>{detailModal.personalStatement || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Admin Remarks:</strong><br/>{detailModal.remarks || '—'}</div>
            </div>
          </section>

          {/* Section 7: Documents Print View */}
          <section className="card print-break" style={{ padding: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 16 }}>7. Uploaded Documents</h3>
            {(!detailModal.documents || detailModal.documents.length === 0) ? (
              <div style={{ color: 'var(--text-muted)' }}>No documents have been uploaded for this application.</div>
            ) : (
              <div>
                {detailModal.documents.map(doc => (
                   <AuthenticatedDocument key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
