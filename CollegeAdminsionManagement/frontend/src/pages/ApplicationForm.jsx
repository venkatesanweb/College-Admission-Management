import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';

const initialFormState = {
  collegeName: '',
  courseId: '',
  marks: '',
  previousSchool: '',

  gender: '',
  dateOfBirth: '',
  age: '',
  mobileNumber: '',
  emailId: '',
  aadhaarNumber: '',
  epicNumber: '',
  nationality: '',
  religion: '',
  community: '',
  caste: '',

  permanentAddressLine: '',
  permanentDistrict: '',
  permanentState: '',
  permanentPincode: '',
  isCommunicationSame: false,
  communicationAddressLine: '',
  communicationDistrict: '',
  communicationState: '',
  communicationPincode: '',

  fatherName: '',
  motherName: '',
  guardianName: '',
  parentOccupation: '',
  annualIncome: '',
  incomeCertificateNumber: '',
  parentMobileNumber: '',

  admissionCategory: 'FRESHER',
  branchSpecialization: '',
  modeOfStudy: 'FULL_TIME',

  hscSchoolName: '', hscBoard: '', hscRegisterNumber: '', hscYearOfPassing: '',
  hscPhysicsMarks: '', hscChemistryMarks: '', hscMathsMarks: '',
  hscTotalMarks: '', hscCutoff: '',

  diplomaCollege: '', diplomaBranch: '', diplomaRegisterNumber: '', diplomaYearOfPassing: '', diplomaPercentage: '',

  ugDegree: '', ugCollege: '', ugUniversity: '', ugYearOfPassing: '', ugPercentage: '',

  pgDegree: '', pgSpecialization: '', pgMarks: '', pgResearchDetails: '',

  tcNumber: '',

  isFirstGraduate: false,
  firstGraduateCertificateNumber: '',
  isDifferentlyAbled: false,
  isExServiceman: false,
  hasSportsQuota: false,

  isRegisteredInTnPortal: false,
  tnRegistrationNumber: '',

  paymentMode: 'ONLINE',
  transactionId: '',

  isDeclared: false,
  studentSignatureName: '',
  parentSignatureName: '',
  signatureDate: ''
};

const ApplicationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Document Upload States
  const [marksheetFile, setMarksheetFile] = useState(null);
  const [tcFile, setTcFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    ...initialFormState,
    emailId: user?.email || '',
    mobileNumber: user?.phone || '',
  });

  useEffect(() => {
    fetchCourses();
    if (id) {
        fetchApplicationDetails();
    }
  }, [id]);

  useEffect(() => {
    if (form.courseId && !form.collegeName && courses.length > 0) {
      const selectedCourse = courses.find(c => c.id === Number(form.courseId));
      if (selectedCourse) {
        setForm(prev => ({ ...prev, collegeName: selectedCourse.collegeName }));
      }
    }
  }, [form.courseId, courses]);

  const fetchCourses = async () => {
    try {
      const res = await API.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const fetchApplicationDetails = async () => {
    try {
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        const endpoint = isAdmin ? `/admin/applications/${id}` : `/student/applications/${id}`;
        const res = await API.get(endpoint);
        const data = res.data.data;
        // Strip null values appropriately or spread them in
        const filledForm = { ...initialFormState };
        for (const key in data) {
            if (data[key] !== null) {
                filledForm[key] = data[key];
            }
        }
        filledForm.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
        filledForm.signatureDate = data.signatureDate ? new Date(data.signatureDate).toISOString().split('T')[0] : '';
        setForm(filledForm);
    } catch (err) {
        toast.error('Failed to fetch existing application');
        navigate('/student/dashboard');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateCutoff = (maths, physics, chemistry) => {
    const m = parseFloat(maths) || 0;
    const p = parseFloat(physics) || 0;
    const c = parseFloat(chemistry) || 0;
    return (m + (p / 2) + (c / 2)).toFixed(2);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    setForm(prev => {
      const updated = { ...prev, [name]: newValue };

      if (name === 'dateOfBirth') {
        updated.age = calculateAge(newValue);
      } else if (name === 'isCommunicationSame') {
        if (checked) {
          updated.communicationAddressLine = updated.permanentAddressLine;
          updated.communicationDistrict = updated.permanentDistrict;
          updated.communicationState = updated.permanentState;
          updated.communicationPincode = updated.permanentPincode;
        } else {
          updated.communicationAddressLine = '';
          updated.communicationDistrict = '';
          updated.communicationState = '';
          updated.communicationPincode = '';
        }
      } else if (['hscMathsMarks', 'hscPhysicsMarks', 'hscChemistryMarks'].includes(name)) {
         updated.hscCutoff = calculateCutoff(
           name === 'hscMathsMarks' ? newValue : updated.hscMathsMarks,
           name === 'hscPhysicsMarks' ? newValue : updated.hscPhysicsMarks,
           name === 'hscChemistryMarks' ? newValue : updated.hscChemistryMarks
         );
         updated.marks = updated.hscCutoff;
      }

      if (name === 'diplomaPercentage') updated.marks = newValue;
      if (name === 'ugPercentage') updated.marks = newValue;

      if (name === 'collegeName') {
        updated.courseId = '';
      }

      return updated;
    });
  };

  const uploadFileSequential = async (applicationId, file) => {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
          await API.post(`/student/applications/${applicationId}/documents`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
      } catch (e) {
          console.error("Document upload skipped or failed", e);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.isDeclared) {
      toast.error('You must declare the information is true to submit.');
      return;
    }
    if (!form.courseId) {
      toast.error('Please select a course');
      return;
    }

    setLoading(true);
    try {
      const { collegeName, ...restForm } = form;
      const payload = {
        ...restForm,
        marks: parseFloat(restForm.marks) || 0,
        age: parseInt(restForm.age) || 0,
        courseId: parseInt(restForm.courseId),
        hscPhysicsMarks: parseFloat(restForm.hscPhysicsMarks) || null,
        hscChemistryMarks: parseFloat(restForm.hscChemistryMarks) || null,
        hscMathsMarks: parseFloat(restForm.hscMathsMarks) || null,
        hscTotalMarks: parseFloat(restForm.hscTotalMarks) || null,
        hscCutoff: parseFloat(restForm.hscCutoff) || null,
        diplomaPercentage: parseFloat(restForm.diplomaPercentage) || null,
        ugPercentage: parseFloat(restForm.ugPercentage) || null,
        pgMarks: parseFloat(restForm.pgMarks) || null,
        annualIncome: parseFloat(restForm.annualIncome) || null,
      };

      let finalAppId = null;
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

      if (id) {
          const endpoint = isAdmin ? `/admin/applications/${id}` : `/student/applications/${id}`;
          const res = await API.put(endpoint, payload);
          finalAppId = res.data.data.id;
          toast.success('Your application was updated successfully!');
      } else {
          const res = await API.post('/student/applications', payload);
          finalAppId = res.data.data.id;
          toast.success('Your application was submitted successfully!');
      }

      // Inline Document Uploads processing
      if (finalAppId) {
          if (marksheetFile) await uploadFileSequential(finalAppId, marksheetFile);
          if (tcFile) await uploadFileSequential(finalAppId, tcFile);
          if (photoFile) await uploadFileSequential(finalAppId, photoFile);
      }

      if (isAdmin) {
          navigate('/admin/dashboard');
      } else {
          navigate('/student/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 className="topbar-title">{id ? 'Edit Application Details' : 'Comprehensive Admission Application'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {id 
                ? (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'You are editing this application as an administrator.' : 'You are allowed up to 3 application edits.') 
                : 'Fill in all the required details below to complete your college application.'}
            </p>
        </div>
        {id && (
            <div className="badge badge-info">Editing Mode</div>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Step Progress Container */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {[...Array(10)].map((_, i) => (
             <div key={i} style={{ flex: 1, height: 4, background: currentStep >= i + 1 ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: 2 }} />
          ))}
        </div>
        
        {/* 1. Basic Details */}
        {currentStep === 1 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">1. Basic Details</h2></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-select" value={form.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" className="form-input" value={form.dateOfBirth} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Age (Auto-calculated)</label>
              <input type="text" name="age" className="form-input" value={form.age} readOnly disabled style={{ background: 'var(--bg-secondary)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input type="tel" name="mobileNumber" className="form-input" value={form.mobileNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email ID</label>
              <input type="email" name="emailId" className="form-input" value={form.emailId} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar Number (Mandatory)</label>
              <input type="text" name="aadhaarNumber" className="form-input" value={form.aadhaarNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">EPIC Number (Voter ID - Optional)</label>
              <input type="text" name="epicNumber" className="form-input" value={form.epicNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Nationality</label>
              <input type="text" name="nationality" className="form-input" value={form.nationality} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Religion</label>
              <input type="text" name="religion" className="form-input" value={form.religion} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Community</label>
              <select name="community" className="form-select" value={form.community} onChange={handleChange}>
                <option value="">Select Community</option>
                <option value="OC">OC</option>
                <option value="BC">BC</option>
                <option value="MBC">MBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Caste</label>
              <input type="text" name="caste" className="form-input" value={form.caste} onChange={handleChange} />
            </div>
          </div>
        </div>
        )}

        {/* 2. Address Details */}
        {currentStep === 2 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">2. Address Details</h2></div>
          <h3 className="card-subtitle" style={{ marginBottom: 12 }}>Permanent Address</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Address Line</label>
              <input type="text" name="permanentAddressLine" className="form-input" value={form.permanentAddressLine} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <input type="text" name="permanentDistrict" className="form-input" value={form.permanentDistrict} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input type="text" name="permanentState" className="form-input" value={form.permanentState} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode</label>
              <input type="text" name="permanentPincode" className="form-input" value={form.permanentPincode} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="isCommunicationSame" id="isCommunicationSame" checked={form.isCommunicationSame} onChange={handleChange} />
            <label htmlFor="isCommunicationSame" style={{ color: 'var(--text-secondary)' }}>Communication Address is same as Permanent Address</label>
          </div>

          {!form.isCommunicationSame && (
            <>
              <h3 className="card-subtitle" style={{ marginBottom: 12 }}>Communication Address</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address Line</label>
                  <input type="text" name="communicationAddressLine" className="form-input" value={form.communicationAddressLine} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input type="text" name="communicationDistrict" className="form-input" value={form.communicationDistrict} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" name="communicationState" className="form-input" value={form.communicationState} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input type="text" name="communicationPincode" className="form-input" value={form.communicationPincode} onChange={handleChange} />
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* 3. Parent / Guardian Details */}
        {currentStep === 3 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">3. Parent / Guardian Details</h2></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Father's Name</label>
              <input type="text" name="fatherName" className="form-input" value={form.fatherName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Mother's Name</label>
              <input type="text" name="motherName" className="form-input" value={form.motherName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian's Name</label>
              <input type="text" name="guardianName" className="form-input" value={form.guardianName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent's Occupation</label>
              <input type="text" name="parentOccupation" className="form-input" value={form.parentOccupation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Annual Income</label>
              <input type="number" name="annualIncome" className="form-input" value={form.annualIncome} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Income Certificate Number</label>
              <input type="text" name="incomeCertificateNumber" className="form-input" value={form.incomeCertificateNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Mobile Number</label>
              <input type="tel" name="parentMobileNumber" className="form-input" value={form.parentMobileNumber} onChange={handleChange} />
            </div>
          </div>
        </div>
        )}

        {/* 4 & 5. Course Preference & Category */}
        {currentStep === 4 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">4. Admission & Course Preference</h2></div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Admission Category</label>
              <select name="admissionCategory" className="form-select" value={form.admissionCategory} onChange={handleChange} required>
                <option value="FRESHER">Freshers (12th Pass)</option>
                <option value="DIPLOMA">Diploma (Lateral Entry)</option>
                <option value="UG_ADMISSION">UG Admission</option>
                <option value="PG_ADMISSION">PG Admission</option>
                <option value="TRANSFER">Transfer Student</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mode of Study</label>
              <select name="modeOfStudy" className="form-select" value={form.modeOfStudy} onChange={handleChange}>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">College *</label>
              <select name="collegeName" className="form-select" value={form.collegeName} onChange={handleChange} required>
                <option value="">Select a college</option>
                {Array.from(new Set(courses.map(c => c.collegeName).filter(Boolean))).map(college => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Course Applied For *</label>
              <select name="courseId" className="form-select" value={form.courseId} onChange={handleChange} required disabled={!form.collegeName}>
                <option value="">{form.collegeName ? 'Select a college course' : 'Select a college first'}</option>
                {courses
                  .filter(c => !form.collegeName || c.collegeName === form.collegeName)
                  .map(c => <option key={c.id} value={c.id}>{c.name} — ₹{c.fees}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Branch / Specialization</label>
              <input type="text" name="branchSpecialization" className="form-input" value={form.branchSpecialization} onChange={handleChange} />
            </div>
          </div>
        </div>
        )}

        {/* 6. Academic Details Dynamic */}
        {currentStep === 5 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">5. Academic Details</h2></div>
          
          {form.admissionCategory === 'FRESHER' && (
            <div>
              <h3 className="card-subtitle" style={{ marginBottom: 12 }}>A. HSC (12th Students)</h3>
              <div className="form-row">
                <div className="form-group"><label className="form-label">School Name</label><input type="text" name="hscSchoolName" className="form-input" value={form.hscSchoolName} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Board</label><input type="text" name="hscBoard" className="form-input" value={form.hscBoard} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Register Number</label><input type="text" name="hscRegisterNumber" className="form-input" value={form.hscRegisterNumber} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Year of Passing</label><input type="text" name="hscYearOfPassing" className="form-input" value={form.hscYearOfPassing} onChange={handleChange} /></div>
                
                <div className="form-group"><label className="form-label">Physics Marks</label><input type="number" name="hscPhysicsMarks" className="form-input" value={form.hscPhysicsMarks} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Chemistry Marks</label><input type="number" name="hscChemistryMarks" className="form-input" value={form.hscChemistryMarks} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Maths Marks</label><input type="number" name="hscMathsMarks" className="form-input" value={form.hscMathsMarks} onChange={handleChange} /></div>
                
                <div className="form-group"><label className="form-label">Total Marks</label><input type="number" name="hscTotalMarks" className="form-input" value={form.hscTotalMarks} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Cut-off (M + P/2 + C/2)</label><input type="text" name="hscCutoff" className="form-input" value={form.hscCutoff} readOnly disabled style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 'bold' }} /></div>
              </div>
            </div>
          )}

          {form.admissionCategory === 'DIPLOMA' && (
            <div>
              <h3 className="card-subtitle" style={{ marginBottom: 12 }}>B. Diploma Students</h3>
               <div className="form-row">
                <div className="form-group"><label className="form-label">Diploma College Name</label><input type="text" name="diplomaCollege" className="form-input" value={form.diplomaCollege} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Branch</label><input type="text" name="diplomaBranch" className="form-input" value={form.diplomaBranch} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Register Number</label><input type="text" name="diplomaRegisterNumber" className="form-input" value={form.diplomaRegisterNumber} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Year of Passing</label><input type="text" name="diplomaYearOfPassing" className="form-input" value={form.diplomaYearOfPassing} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Percentage / CGPA</label><input type="number" name="diplomaPercentage" className="form-input" value={form.diplomaPercentage} onChange={handleChange} /></div>
               </div>
            </div>
          )}

          {form.admissionCategory === 'PG_ADMISSION' && (
            <div>
              <h3 className="card-subtitle" style={{ marginBottom: 12 }}>C/D. UG/PG Students</h3>
               <div className="form-row">
                <div className="form-group"><label className="form-label">UG Degree</label><input type="text" name="ugDegree" className="form-input" value={form.ugDegree} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">College Name</label><input type="text" name="ugCollege" className="form-input" value={form.ugCollege} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">University</label><input type="text" name="ugUniversity" className="form-input" value={form.ugUniversity} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Year of Passing</label><input type="text" name="ugYearOfPassing" className="form-input" value={form.ugYearOfPassing} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">CGPA / Percentage</label><input type="number" name="ugPercentage" className="form-input" value={form.ugPercentage} onChange={handleChange} /></div>
               </div>
            </div>
          )}
        </div>
        )}

        {/* 7. Document Upload Section (Real File UI) */}
        {currentStep === 6 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">6. Document Upload & Details</h2></div>
          <p className="card-subtitle" style={{ marginBottom: 16 }}>Please attach the relevant PDFs or JPEGs for your application to be processed promptly.</p>
          <div className="form-row" style={{ alignItems: 'flex-start' }}>
            <div className="form-group">
              <label className="form-label">Transfer Certificate (TC) Number</label>
              <input type="text" name="tcNumber" className="form-input" value={form.tcNumber} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}></div> {/* Empty spacer */}

            <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 16, borderRadius: 8 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUpload /> Upload Marksheet</label>
                <input type="file" className="form-input" accept="image/*" onChange={(e) => setMarksheetFile(e.target.files[0])} />
                {marksheetFile && <p style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--success-color)' }}>{marksheetFile.name} selected</p>}
            </div>

            <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 16, borderRadius: 8 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUpload /> Upload TC / Community Cert</label>
                <input type="file" className="form-input" accept="image/*" onChange={(e) => setTcFile(e.target.files[0])} />
                {tcFile && <p style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--success-color)' }}>{tcFile.name} selected</p>}
            </div>

            <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 16, borderRadius: 8 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUpload /> Upload Photo / Signature</label>
                <input type="file" className="form-input" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
                {photoFile && <p style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--success-color)' }}>{photoFile.name} selected</p>}
            </div>
          </div>
        </div>
        )}

        {/* 8. Reservation */}
        {currentStep === 7 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">7. Reservation / Special Category</h2></div>
          <div className="form-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="form-group">
                <input type="checkbox" name="isFirstGraduate" id="isFirstGraduate" checked={form.isFirstGraduate} onChange={handleChange} />
                <label htmlFor="isFirstGraduate">First Graduate (Yes/No)</label>
            </div>
            {form.isFirstGraduate && (
              <div className="form-group">
                <label className="form-label">First Graduate Certificate Number</label>
                <input type="text" name="firstGraduateCertificateNumber" className="form-input" value={form.firstGraduateCertificateNumber} onChange={handleChange} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="form-group">
                <input type="checkbox" name="isDifferentlyAbled" id="isDifferentlyAbled" checked={form.isDifferentlyAbled} onChange={handleChange} />
                <label htmlFor="isDifferentlyAbled">Differently Abled</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="form-group">
                <input type="checkbox" name="isExServiceman" id="isExServiceman" checked={form.isExServiceman} onChange={handleChange} />
                <label htmlFor="isExServiceman">Ex-Serviceman Quota</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="form-group">
                <input type="checkbox" name="hasSportsQuota" id="hasSportsQuota" checked={form.hasSportsQuota} onChange={handleChange} />
                <label htmlFor="hasSportsQuota">Sports Quota</label>
            </div>
          </div>
        </div>
        )}

        {/* 9. TN Admission Details */}
        {currentStep === 8 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">8. Tamil Nadu Admission Details</h2></div>
          <div className="form-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="form-group">
              <input type="checkbox" name="isRegisteredInTnPortal" id="isRegisteredInTnPortal" checked={form.isRegisteredInTnPortal} onChange={handleChange} />
              <label htmlFor="isRegisteredInTnPortal">Registered in TN Admission Portal?</label>
            </div>
            {form.isRegisteredInTnPortal && (
              <div className="form-group">
                <label className="form-label">TN Admission Registration Number</label>
                <input type="text" name="tnRegistrationNumber" className="form-input" value={form.tnRegistrationNumber} onChange={handleChange} />
              </div>
            )}
          </div>
        </div>
        )}

        {/* 10. Application Fee */}
        {currentStep === 9 && (
        <div className="card">
          <div className="card-header"><h2 className="card-title">9. Application Fee</h2></div>
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Application Fee: ₹250</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Scan the QR Code below to pay the application fee online.</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=college@admin&pn=College+Admission&am=250.00&cu=INR" alt="QR Scanner" style={{ maxWidth: '200px', margin: '0 auto', display: 'block', borderRadius: '8px', border: '5px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select name="paymentMode" className="form-select" value={form.paymentMode} onChange={handleChange}>
                <option value="ONLINE">Online (UPI / Card / NetBanking)</option>
                <option value="CHALLAN">DD / Bank Challan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction ID / DD Number</label>
              <input type="text" name="transactionId" className="form-input" value={form.transactionId} onChange={handleChange} required={form.paymentMode === 'ONLINE'} />
            </div>
          </div>
        </div>
        )}

        {/* 11. Declaration */}
        {currentStep === 10 && (
        <div className="card" style={{ borderTop: '4px solid var(--accent-primary)' }}>
          <div className="card-header"><h2 className="card-title">10. Declaration</h2></div>
          
          <div style={{ margin: '16px 0', padding: '16px', background: 'var(--bg-glass)', borderRadius: '8px' }}>
             <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <input type="checkbox" name="isDeclared" id="isDeclared" checked={form.isDeclared} onChange={handleChange} style={{ marginTop: 4 }} />
                <label htmlFor="isDeclared" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  “I hereby declare that all the information provided is true to the best of my knowledge and belief. I understand that if any information is found to be false or incorrect, my admission may be cancelled.”
                </label>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: 24 }}>
            <div className="form-group">
              <label className="form-label">Student Signature (Full Name)</label>
              <input type="text" name="studentSignatureName" className="form-input" value={form.studentSignatureName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Signature (Full Name)</label>
              <input type="text" name="parentSignatureName" className="form-input" value={form.parentSignatureName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" name="signatureDate" className="form-input" value={form.signatureDate} onChange={handleChange} />
            </div>
          </div>
        </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 40 }}>
          {currentStep > 1 ? (
             <button type="button" className="btn btn-secondary btn-lg" onClick={() => {
               let prev = currentStep - 1;
               if (currentStep === 6 && !['FRESHER', 'DIPLOMA', 'PG_ADMISSION'].includes(form.admissionCategory)) prev = 4;
               setCurrentStep(prev);
               window.scrollTo({ top: 0, behavior: 'smooth' });
             }} style={{ flex: 1 }}>Back</button>
          ) : (
             <button type="button" className="btn btn-secondary btn-lg" onClick={() => {
                if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
                  navigate('/admin/dashboard');
                } else {
                  navigate('/student/dashboard');
                }
             }} style={{ flex: 1 }}>Cancel</button>
          )}

          {currentStep < 10 ? (
             <button type="button" className="btn btn-primary btn-lg" onClick={() => {
               if (formRef.current && formRef.current.reportValidity()) {
                 let next = currentStep + 1;
                 if (currentStep === 4 && !['FRESHER', 'DIPLOMA', 'PG_ADMISSION'].includes(form.admissionCategory)) next = 6;
                 setCurrentStep(next);
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               }
             }} style={{ flex: 2 }}>Next Step</button>
          ) : (
             <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 2 }}>
               {loading ? 'Processing Application...' : (id ? 'Save Edits' : 'Submit Final Application')}
             </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
