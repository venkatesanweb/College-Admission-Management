import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', otp: '' });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(form.email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(form.fullName, form.email, form.password, form.phone, form.otp);
      toast.success('Account created successfully!');
      navigate('/student/dashboard'); // Roles are implicitly STUDENT now
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the College Admission Portal</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" name="fullName" type="text" className="form-input"
                placeholder="Enter your full name" value={form.fullName} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input id="reg-email" name="email" type="email" className="form-input"
                placeholder="Enter your email" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input id="reg-password" name="password" type="password" className="form-input"
                  placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone</label>
                <input id="reg-phone" name="phone" type="tel" className="form-input"
                  placeholder="Phone number" value={form.phone} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-otp">Enter OTP</label>
              <input id="reg-otp" name="otp" type="text" className="form-input"
                placeholder="6-digit OTP" value={form.otp} onChange={handleChange} required maxLength={6} />
              <small className="form-text text-muted" style={{ display: 'block', marginTop: 4 }}>
                We sent an OTP to {form.email}.
              </small>
            </div>

            <button type="button" className="btn btn-secondary btn-block" style={{ marginBottom: 12 }} onClick={() => setStep(1)} disabled={loading}>
              Back
            </button>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Verify and Register'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
