import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useForm } from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  usePageTitle('Login');
  const navigate = useNavigate();
  const { login, isAuth, userRole } = useAuth();

  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [focusedField, setFocused]  = useState('');
  const [btnHover, setBtnHover]     = useState(false);
  const [signupHover, setSignup]    = useState(false);
  const [forgotHover, setForgot]    = useState(false);
  const { values, handleChange }    = useForm({ email: '', password: '' });

  // Already logged in — go to correct dashboard
  if (isAuth) {
    if (userRole === 'admin')  return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'staff')  return <Navigate to="/staff-dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!values.email || !values.password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/user/login', {
        method: 'POST',
        body: { email: values.email, password: values.password },
      });
      const { name, role, email, id } = data.data;
      const token = data.token;
      login(name, role, email, id, token);
      toast.success('Welcome, ' + name + '!');
      if (role === 'admin')       navigate('/admin-dashboard', { replace: true });
      else if (role === 'staff')  navigate('/staff-dashboard', { replace: true });
      else                        navigate('/home',            { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <Toaster position="top-right" />
      <div style={S.glow1} />
      <div style={S.glow2} />
      <div style={S.wrap}>
        <div style={S.brand}>
          <h1 style={S.brandName}>MyTripAgency</h1>
          <p style={S.brandSub}>Your journey begins here</p>
        </div>
        <div style={S.card}>
          <h2 style={S.title}>Welcome Back</h2>
          <p style={S.sub}>Sign in to continue your adventure</p>
          {error && <p style={S.err}>{error}</p>}
          <form style={S.form} onSubmit={handleSubmit}>
            <label style={S.label}>Email</label>
            <input
              style={S.inp(focusedField === 'email')}
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              placeholder="Enter your email"
              autoComplete="email"
            />
            <label style={S.label}>Password</label>
            <input
              style={S.inp(focusedField === 'password')}
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <div style={S.fRow}>
              <Link
                to="/forgot"
                style={S.link(forgotHover)}
                onMouseEnter={() => setForgot(true)}
                onMouseLeave={() => setForgot(false)}
              >
                Forgot Password?
              </Link>
            </div>
            <button
              style={S.btn(btnHover, loading)}
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <p style={S.sw}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={S.link(signupHover)}
              onMouseEnter={() => setSignup(true)}
              onMouseLeave={() => setSignup(false)}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    position: 'relative', minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 50%,#111827 0%,#030712 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '20px', overflow: 'hidden', boxSizing: 'border-box',
  },
  glow1: {
    position: 'absolute', top: '15%', left: '15%',
    width: '350px', height: '350px',
    background: 'rgba(99,102,241,0.15)', borderRadius: '50%',
    filter: 'blur(90px)', zIndex: 1, pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', bottom: '15%', right: '15%',
    width: '400px', height: '400px',
    background: 'rgba(236,72,153,0.1)', borderRadius: '50%',
    filter: 'blur(100px)', zIndex: 1, pointerEvents: 'none',
  },
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 2 },
  brand: { textAlign: 'center', color: '#fff', marginBottom: '28px' },
  brandName: { fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', textShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  brandSub: { fontSize: '14px', color: '#9ca3af', margin: '6px 0 0', letterSpacing: '0.5px' },
  card: {
    background: 'rgba(17,24,39,0.75)', backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', boxSizing: 'border-box',
  },
  title: { fontSize: '26px', fontWeight: '700', color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px', textAlign: 'left' },
  sub: { fontSize: '14px', color: '#9ca3af', marginBottom: '24px', textAlign: 'left' },
  err: { background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(239,68,68,0.2)' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', color: '#d1d5db', marginTop: '16px', marginBottom: '6px', fontWeight: '600', textAlign: 'left' },
  inp: focused => ({
    padding: '12px 16px',
    border: `1px solid ${focused ? '#818cf8' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '10px', fontSize: '14px',
    backgroundColor: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
    color: '#fff', outline: 'none',
    boxShadow: focused ? '0 0 12px rgba(129,140,248,0.25)' : 'none',
    transition: 'all 0.3s ease',
  }),
  fRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' },
  btn: (hover, load) => ({
    marginTop: '26px', padding: '13px',
    background: hover ? 'linear-gradient(135deg,#5a52e6,#8b4bf0)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
    cursor: load ? 'not-allowed' : 'pointer', fontWeight: '600',
    transform: hover && !load ? 'translateY(-1px)' : 'none',
    boxShadow: hover ? '0 8px 24px rgba(124,58,237,0.4)' : '0 4px 12px rgba(124,58,237,0.2)',
    transition: 'all 0.3s ease', opacity: load ? 0.7 : 1,
  }),
  sw: { textAlign: 'center', fontSize: '14px', color: '#9ca3af', marginTop: '24px', marginBottom: 0 },
  link: hover => ({ color: hover ? '#a5b4fc' : '#818cf8', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s ease' }),
};
