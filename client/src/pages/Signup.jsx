import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function Signup() {
  usePageTitle('Create Account');
  const navigate = useNavigate();
  const { isAuth, userRole } = useAuth();
  const [error, setError] = useState('');
  const [role, setRole] = useState('client');
  const { values, handleChange } = useForm({ name: '', email: '', password: '', confirm: '', phone: '' });

  const [focusedField, setFocusedField] = useState('');
  const [btnHover, setBtnHover] = useState(false);
  const [loginLinkHover, setLoginLinkHover] = useState(false);

  // All hooks above — early return after
  if (isAuth) {
    return <Navigate to={userRole === 'staff' ? '/staff-dashboard' : '/home'} replace />;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!values.name || !values.email || !values.password || !values.confirm) { setError('All fields are required.'); return; }
    if (values.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (values.password !== values.confirm) { setError('Passwords do not match.'); return; }

    try {
      await apiFetch('/user/signup', {
        method:  'POST',
        body:    { name: values.name, email: values.email, password: values.password, phone: values.phone, role },
      });
      toast.success('Account created! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Server error. Please try again.');
    }
  };

  return (
    <div style={styles.page}>
      <Toaster position="top-right" />
      <div style={styles.glowCircle1}></div>
      <div style={styles.glowCircle2}></div>

      <div style={styles.container}>
        <div style={styles.brand}>
          <h1 style={styles.brandName}>MyTripAgency</h1>
          <p style={styles.brandSub}>Your journey begins here</p>
        </div>
        <div style={styles.card}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.sub}>Join us and explore the world</p>
          {error && <p style={styles.error}>{error}</p>}
          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input(focusedField === 'name')}
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField('')}
              placeholder="Enter your full name"
            />

            <label style={styles.label}>Email</label>
            <input
              style={styles.input(focusedField === 'email')}
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              placeholder="Enter your email"
            />

            <label style={styles.label}>Phone (Optional)</label>
            <input
              style={styles.input(focusedField === 'phone')}
              type="tel"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField('')}
              placeholder="Enter your phone number"
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input(focusedField === 'password')}
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              placeholder="Min 6 characters"
            />

            <label style={styles.label}>Confirm Password</label>
            <input
              style={styles.input(focusedField === 'confirm')}
              type="password"
              name="confirm"
              value={values.confirm}
              onChange={handleChange}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField('')}
              placeholder="Repeat your password"
            />

            <label style={styles.label}>Select Your Role</label>
            <select
              style={styles.select(focusedField === 'role')}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onFocus={() => setFocusedField('role')}
              onBlur={() => setFocusedField('')}
            >
              <option style={styles.option} value="client">Client / Tourist</option>
              <option style={styles.option} value="staff">Staff / Guide</option>
            </select>

            <button
              style={styles.btn(btnHover)}
              type="submit"
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              Sign Up
            </button>
          </form>
          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={styles.link(loginLinkHover)}
              onMouseEnter={() => setLoginLinkHover(true)}
              onMouseLeave={() => setLoginLinkHover(false)}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    overflowY: 'auto',
    boxSizing: 'border-box'
  },
  glowCircle1: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '400px',
    height: '400px',
    background: 'rgba(99, 102, 241, 0.12)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: '450px',
    height: '450px',
    background: 'rgba(236, 72, 153, 0.08)',
    borderRadius: '50%',
    filter: 'blur(110px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  brand: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: '28px'
  },
  brandName: {
    fontSize: '32px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
    textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  brandSub: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '6px 0 0',
    letterSpacing: '0.5px'
  },
  card: {
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    boxSizing: 'border-box'
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
    textAlign: 'left'
  },
  sub: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '24px',
    textAlign: 'left'
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    fontSize: '13px',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '18px',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '13px',
    color: '#d1d5db',
    marginTop: '16px',
    marginBottom: '6px',
    fontWeight: '600',
    textAlign: 'left'
  },
  input: (isFocused) => ({
    padding: '12px 16px',
    border: isFocused ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: isFocused ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
    color: '#fff',
    outline: 'none',
    boxShadow: isFocused ? '0 0 12px rgba(129, 140, 248, 0.25)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }),
  select: (isFocused) => ({
    padding: '12px 16px',
    border: isFocused ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: '#111827',
    color: '#fff',
    outline: 'none',
    boxShadow: isFocused ? '0 0 12px rgba(129, 140, 248, 0.25)' : 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  }),
  option: {
    background: '#111827',
    color: '#fff'
  },
  btn: (isHovered) => ({
    marginTop: '28px',
    padding: '13px',
    background: isHovered ? 'linear-gradient(135deg, #5a52e6, #8b4bf0)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
    fontWeight: '600',
    transform: isHovered ? 'translateY(-1px)' : 'none',
    boxShadow: isHovered ? '0 8px 24px rgba(124, 58, 237, 0.4)' : '0 4px 12px rgba(124, 58, 237, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }),
  switchText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '24px',
    marginBottom: 0
  },
  link: (isHovered) => ({
    color: isHovered ? '#a5b4fc' : '#818cf8',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.2s ease'
  }),
};
