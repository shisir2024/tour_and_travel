import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';

const faqs = [
  { q: 'How can I book a tour?',             a: 'You can book tours directly from our website by selecting your destination and completing the booking process.' },
  { q: 'Can I cancel my booking?',            a: 'Yes, bookings can be canceled according to our cancellation policy.' },
  { q: 'What payment methods do you accept?', a: 'We accept credit cards, debit cards, online banking, and digital wallets.' },
  { q: 'Do you provide international tours?', a: 'Yes, we provide both domestic and international travel packages.' },
  { q: 'Is customer support available 24/7?', a: 'Yes, our support team is available 24/7 to assist travelers.' },
];

export default function Faq() {
  usePageTitle('FAQ');
  const [open, setOpen] = useState(0);

  return (
    <>
      <Navbar />
      <section style={styles.section}>
        <div style={styles.container}>
          <h1 style={styles.title}>Frequently Asked Questions</h1>
          {faqs.map((f, i) => (
            <div key={i} style={styles.item}>
              <button style={styles.question} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <span>{open === i ? '▲' : '▼'}</span>
              </button>
              {open === i && <div style={styles.answer}>{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}

const styles = {
  section:  { padding: '80px 20px', background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)', minHeight: '100vh' },
  container:{ maxWidth: '800px', margin: '0 auto' },
  title:    { fontSize: '48px', fontWeight: 'bold', textAlign: 'center', color: '#0d1b2a', marginBottom: '50px' },
  item:     { marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' },
  question: { width: '100%', background: '#0d6efd', color: '#fff', border: 'none', padding: '18px 20px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  answer:   { background: '#fff', padding: '18px 20px', fontSize: '15px', lineHeight: 1.8, color: '#333' },
};
