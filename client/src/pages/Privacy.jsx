import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

const sections = [
  { icon: '📋', h: 'Information Collection', p: 'We collect basic user information such as name, email address, and booking details to improve our services.' },
  { icon: '🔒', h: 'Data Security',          p: 'Your information is stored securely and protected from unauthorized access.' },
  { icon: '🍪', h: 'Cookies',                p: 'Our website may use cookies to improve user experience and website functionality.' },
  { icon: '👤', h: 'User Rights',            p: 'Users have the right to access, update, or remove their personal information.' },
  { icon: '🔄', h: 'Policy Updates',         p: 'We may update this privacy policy periodically to improve our services and maintain transparency.' },
];

export default function Privacy() {
  const [agreed, setAgreed] = useState(false);
  const [done,   setDone]   = useState(false);

  const handleAccept = async () => {
    const email = localStorage.getItem('loggedInEmail') || 'guest@mytripagency.com';
    try {
      await apiFetch('/privacy/consent', {
        method:  'POST',
        body:    { email },
      });
      setDone(true);
      toast.success('✅ Privacy policy accepted and recorded.');
    } catch (err) {
      toast.error(err.message || 'Server error. Please try again.');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={styles.page}>
        <div style={styles.hero}>
          <p style={styles.heroTag}>LEGAL</p>
          <h1 style={styles.heroTitle}>Privacy Policy</h1>
          <p style={styles.heroSub}>Last updated: January 2026</p>
        </div>

        <div style={styles.container}>
          <p style={styles.intro}>
            At <strong>MyTripAgency</strong>, we value your privacy and are committed
            to protecting your personal information. Please read the sections below carefully.
          </p>

          <div style={styles.timeline}>
            {sections.map((s, i) => (
              <div key={s.h} style={styles.timelineItem}>
                <div style={styles.timelineLeft}>
                  <div style={styles.badge}>{s.icon}</div>
                  {i < sections.length - 1 && <div style={styles.line} />}
                </div>
                <div style={styles.timelineCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.stepNum}>0{i + 1}</span>
                    <h3 style={styles.cardTitle}>{s.h}</h3>
                  </div>
                  <p style={styles.cardText}>{s.p}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.acceptBox}>
            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); setDone(false); }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={styles.checkLabel}>
                I have read and agree to the Terms & Conditions and Privacy Policy
              </span>
            </label>
            <button
              style={{ ...styles.btn, ...(agreed ? {} : styles.btnDisabled) }}
              disabled={!agreed || done}
              onClick={handleAccept}
            >
              {done ? '✅ Policy Accepted' : 'Accept Policy'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

const styles = {
  page:         { background: '#f0f4f8', minHeight: '100vh' },
  hero:         { background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)', color: '#fff', textAlign: 'center', padding: '70px 20px 50px' },
  heroTag:      { fontSize: '11px', letterSpacing: '4px', color: '#ffc107', marginBottom: '10px', fontWeight: 'bold' },
  heroTitle:    { fontSize: '48px', fontWeight: 'bold', margin: '0 0 10px' },
  heroSub:      { fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0 },
  container:    { maxWidth: '780px', margin: '0 auto', padding: '50px 20px 60px' },
  intro:        { fontSize: '16px', color: '#444', lineHeight: 1.9, marginBottom: '48px', textAlign: 'center' },
  timeline:     { display: 'flex', flexDirection: 'column' },
  timelineItem: { display: 'flex', gap: '20px', marginBottom: '10px' },
  timelineLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '52px', flexShrink: 0 },
  badge:        { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d6efd, #0a58ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: '0 4px 12px rgba(13,110,253,0.3)' },
  line:         { width: '2px', flex: 1, background: 'linear-gradient(to bottom, #0d6efd44, transparent)', margin: '6px 0', minHeight: '30px' },
  timelineCard: { background: '#fff', borderRadius: '14px', padding: '20px 24px', flex: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: '16px' },
  cardHeader:   { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  stepNum:      { fontSize: '11px', fontWeight: 'bold', color: '#0d6efd', background: '#e8f0fe', padding: '3px 8px', borderRadius: '20px', letterSpacing: '1px' },
  cardTitle:    { fontSize: '17px', fontWeight: 'bold', color: '#0d1b2a', margin: 0 },
  cardText:     { fontSize: '15px', color: '#555', lineHeight: 1.8, margin: 0 },
  acceptBox:    { background: '#fff', borderRadius: '14px', padding: '28px 30px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '18px' },
  checkRow:     { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  checkLabel:   { fontSize: '15px', color: '#333', lineHeight: 1.5 },
  btn:          { alignSelf: 'flex-start', background: 'linear-gradient(135deg, #0d6efd, #0a58ca)', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
  btnDisabled:  { background: '#ccc', cursor: 'not-allowed' },
};
