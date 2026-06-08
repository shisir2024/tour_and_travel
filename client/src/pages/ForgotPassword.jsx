import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useForm } from '../hooks/useForm';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function ForgotPassword() {
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const { values, handleChange, reset } = useForm({ email: '' });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!values.email) { toast.error('Please enter your email.'); return; }

    try {
      await apiFetch('/user/forgot-password', {
        method:  'POST',
        body:    { email: values.email },
      });
      toast.success('✅ Reset link sent! Check your email.');
      reset();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message || 'Server error. Please try again.');
    }
  };

  return (
    <div style={styles.page}>
      <Toaster position="top-right" />
      <div style={styles.brand}>
        <h1 style={styles.brandName}>✈️ MyTripAgency</h1>
        <p style={styles.brandSub}>Your journey begins here</p>
      </div>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.sub}>We'll send a reset link to your email</p>
        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" name="email" value={values.email} onChange={handleChange} placeholder="Enter your registered email" autoComplete="email" required />
          <button style={styles.btn} type="submit">Send Reset Link</button>
        </form>
        <p style={styles.switchText}>
          Remembered your password?{' '}
          <Link to="/login" style={styles.link}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f2027, #2c5364)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  brand:     { textAlign: 'center', color: '#fff', marginBottom: '20px' },
  brandName: { fontSize: '26px', fontWeight: 'bold', margin: 0 },
  brandSub:  { fontSize: '13px', color: '#ccc', margin: '4px 0 0' },
  card:      { background: '#fff', borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' },
  title:     { fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' },
  sub:       { fontSize: '13px', color: '#777', marginBottom: '20px' },
  form:      { display: 'flex', flexDirection: 'column' },
  label:     { fontSize: '13px', color: '#444', marginTop: '12px', marginBottom: '5px' },
  input:     { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', background: '#f9f9f9', outline: 'none' },
  btn:       { marginTop: '20px', padding: '11px', background: '#2c5364', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' },
  switchText:{ textAlign: 'center', fontSize: '13px', color: '#777', marginTop: '18px' },
  link:      { color: '#2c5364', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' },
};
