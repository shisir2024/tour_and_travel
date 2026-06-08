import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';
import { useForm } from '../hooks/useForm';
import { useFadeIn } from '../hooks/useFadeIn';
import { apiFetch } from '../utils/api';
import toast, { Toaster } from 'react-hot-toast';

const infos = [
  { icon: '📍', label: 'OFFICE',   value: '123 Adventure Lane, NY' },
  { icon: '📞', label: 'PHONE',    value: '+1 (555) 000-1111' },
  { icon: '✉️', label: 'EMAIL',    value: 'hello@mytripagency.com' },
  { icon: '🕒', label: 'HOURS',    value: 'Mon-Fri: 9am - 6pm' },
];

export default function Contact() {
  usePageTitle('Contact Us');
  const navigate = useNavigate();
  const ref      = useFadeIn();
  const { values, handleChange, reset } = useForm({ name: '', email: '', subject: '', message: '' });
  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await apiFetch('/contact', {
        method:  'POST',
        body:    values,
      });
      toast.success('Message sent successfully! We\'ll reply within 24 hours. 📧');
      reset();
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      toast.error(err.message || 'Server error. Please try again.');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={styles.page} className="dark-section">
        <div ref={ref} className="fade-in" style={styles.wrapper}>
          <div style={styles.left}>
            <div style={styles.leftInner}>
              <p style={styles.leftTag}>GET IN TOUCH</p>
              <h2 style={styles.leftTitle}>We'd love to hear from you ✈️</h2>
              <p style={styles.leftSub}>Have a question about a tour? Want to plan a custom trip? Our team replies within 24 hours.</p>
              <div style={styles.infoList}>
                {infos.map(i => (
                  <div key={i.label} style={styles.infoItem}>
                    <span style={styles.infoIcon}>{i.icon}</span>
                    <div>
                      <p style={styles.infoLabel}>{i.label}</p>
                      <p style={styles.infoValue}>{i.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.circle1} />
            <div style={styles.circle2} />
          </div>

          <div style={styles.right} className="dark-card">
            <h3 style={styles.formTitle}>Send us a Message</h3>
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.row}>
                <div style={styles.fieldWrap}>
                  <label style={styles.label}>Your Name</label>
                  <input ref={nameRef} style={styles.input} className="dark-input" type="text" name="name" value={values.name} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div style={styles.fieldWrap}>
                  <label style={styles.label}>Your Email</label>
                  <input style={styles.input} className="dark-input" type="email" name="email" value={values.email} onChange={handleChange} placeholder="john@email.com" required />
                </div>
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Subject</label>
                <input style={styles.input} className="dark-input" type="text" name="subject" value={values.subject} onChange={handleChange} placeholder="Tour inquiry..." required />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Message</label>
                <textarea style={styles.textarea} className="dark-input" name="message" value={values.message} onChange={handleChange} placeholder="Tell us about your trip plans..." required />
              </div>
              <button style={styles.btn} type="submit">Send Message &nbsp;➤</button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

const styles = {
  page:      { background: '#f0f4f8', minHeight: '100vh', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  wrapper:   { display: 'flex', maxWidth: '1000px', width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', flexWrap: 'wrap' },
  left:      { background: 'linear-gradient(160deg, #0d1b2a, #1a3a5c)', flex: '1 1 300px', padding: '50px 36px', position: 'relative', overflow: 'hidden', color: '#fff' },
  leftInner: { position: 'relative', zIndex: 1 },
  leftTag:   { fontSize: '11px', letterSpacing: '3px', color: '#ffc107', marginBottom: '12px', fontWeight: 'bold' },
  leftTitle: { fontSize: '26px', fontWeight: 'bold', lineHeight: 1.4, marginBottom: '16px' },
  leftSub:   { fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: '36px' },
  infoList:  { display: 'flex', flexDirection: 'column', gap: '22px' },
  infoItem:  { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  infoIcon:  { fontSize: '22px', marginTop: '2px' },
  infoLabel: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', margin: 0 },
  infoValue: { fontSize: '15px', color: '#fff', margin: '2px 0 0', fontWeight: '500' },
  circle1:   { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '40px solid rgba(255,255,255,0.05)', bottom: '-60px', right: '-60px' },
  circle2:   { position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', border: '30px solid rgba(255,255,255,0.05)', top: '30px', right: '30px' },
  right:     { background: '#fff', flex: '2 1 380px', padding: '50px 40px' },
  formTitle: { fontSize: '22px', fontWeight: 'bold', color: '#0d1b2a', marginBottom: '28px' },
  form:      { display: 'flex', flexDirection: 'column', gap: '18px' },
  row:       { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  fieldWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: '160px' },
  label:     { fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' },
  input:     { padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Arial, sans-serif', background: '#fafafa' },
  textarea:  { padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Arial, sans-serif', background: '#fafafa', height: '130px', resize: 'vertical' },
  btn:       { alignSelf: 'flex-start', background: 'linear-gradient(135deg, #0d6efd, #0a58ca)', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
};
