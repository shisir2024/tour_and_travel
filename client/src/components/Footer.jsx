import { Link } from 'react-router-dom';
import { useState } from 'react';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) { toast.error('Please enter a valid email.'); return; }
    try {
      const data = await apiFetch('/newsletter/subscribe', {
        method:  'POST',
        body:    { email },
      });
      toast.success(data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Server error. Please try again.');
    }
  };

  return (
    <>
      <Toaster position="bottom-right" />
      <footer style={s.footer} className="dark-nav">
        <div style={s.grid}>

          <div>
            <h3 style={s.brand}>🌍 MyTripAgency</h3>
            <p style={s.tagline}>Explore the world with comfort, safety, and unforgettable memories.</p>
            <div style={s.socials}>
              {['📘 Facebook','🐦 Twitter','📸 Instagram','▶️ YouTube'].map(x => (
                <span key={x} style={s.social}>{x}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={s.heading}>Quick Links</h4>
            {['/home','/about','/booking','/milestones','/contact','/faq','/privacy'].map(p => (
              <Link key={p} to={p} style={s.link}>{p.replace('/','') || 'home'}</Link>
            ))}
          </div>

          <div>
            <h4 style={s.heading}>Popular Destinations</h4>
            {['Maldives','Bali','Paris','Dubai','Tokyo','Santorini','Switzerland'].map(d => (
              <p key={d} style={s.dest}>📍 {d}</p>
            ))}
          </div>

          <div>
            <h4 style={s.heading}>Newsletter</h4>
            <p style={s.tagline}>Get exclusive deals & travel tips in your inbox.</p>
            <div style={s.inputRow}>
              <input
                style={s.input}
                placeholder="Your email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              />
              <button style={s.btn} onClick={handleSubscribe}>Subscribe</button>
            </div>
            <p style={{ ...s.tagline, marginTop: '20px' }}>📞 +977 9800000000</p>
            <p style={s.tagline}>📧 info@mytripagency.com</p>
          </div>

        </div>
        <div style={s.bottom}>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>© 2026 MyTripAgency — All Rights Reserved</p>
        </div>
      </footer>
    </>
  );
}

const s = {
  footer:   { background: '#0d1b2a', color: '#fff', paddingTop: '50px' },
  grid:     { maxWidth: '1200px', margin: '0 auto', padding: '0 24px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '36px' },
  brand:    { fontSize: '22px', marginBottom: '12px' },
  tagline:  { fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '6px' },
  heading:  { fontSize: '15px', fontWeight: 'bold', color: '#ffc107', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' },
  link:     { display: 'block', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '13px', textTransform: 'capitalize', marginBottom: '8px' },
  dest:     { fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px' },
  socials:  { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' },
  social:   { fontSize: '12px', background: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '20px', cursor: 'pointer' },
  inputRow: { display: 'flex', gap: '8px', marginTop: '10px' },
  input:    { flex: 1, padding: '9px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none' },
  btn:      { background: '#0d6efd', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  bottom:   { borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', padding: '18px 20px', color: '#fff' },
};
