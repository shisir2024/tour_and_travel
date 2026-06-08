import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import { usePageTitle } from '../hooks/usePageTitle';

const stats = [
  { icon: '✈️', count: '320+',  label: 'Tours Completed' },
  { icon: '🌍', count: '48+',   label: 'Destinations Covered' },
  { icon: '👥', count: '5000+', label: 'Happy Travelers' },
  { icon: '⭐', count: '4.9',   label: 'Average Rating' },
];

const trips = [
  { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', place: 'Maldives, South Asia',   date: 'March 2024',     tourists: 24, tag: 'Beach',     tagColor: '#0d6efd' },
  { img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470', place: 'Swiss Alps, Europe',     date: 'January 2024',   tourists: 18, tag: 'Adventure', tagColor: '#198754' },
  { img: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98', place: 'Paris, France',          date: 'November 2023',  tourists: 32, tag: 'City Tour', tagColor: '#6f42c1' },
  { img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', place: 'Santorini, Greece',      date: 'September 2023', tourists: 20, tag: 'Luxury',    tagColor: '#fd7e14' },
  { img: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2', place: 'Bali, Indonesia',        date: 'July 2023',      tourists: 28, tag: 'Cultural',  tagColor: '#dc3545' },
  { img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', place: 'Himalayas, Nepal',       date: 'May 2023',       tourists: 14, tag: 'Trekking',  tagColor: '#20c997' },
  { img: 'https://images.unsplash.com/photo-1523978591478-c753949ff840', place: 'Dubai, UAE',             date: 'February 2023',  tourists: 40, tag: 'Luxury',    tagColor: '#fd7e14' },
  { img: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186', place: 'Kyoto, Japan',           date: 'October 2022',   tourists: 22, tag: 'Cultural',  tagColor: '#dc3545' },
  { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', place: 'Patagonia, Argentina',   date: 'August 2022',    tourists: 16, tag: 'Adventure', tagColor: '#198754' },
];

export default function Milestones() {
  usePageTitle('Milestones');

  // useEffect — log page visit to console (simulates analytics)
  useEffect(() => {
    console.log('Milestones page visited at', new Date().toLocaleTimeString());
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={styles.hero}>
        <p style={styles.heroTag}>OUR WORK</p>
        <h1 style={styles.heroTitle}>Our Milestones 🏆</h1>
        <p style={styles.heroSub}>Every journey we've crafted, every smile we've created — here's our story in pictures.</p>
      </div>

      {/* Stats bar — StatCard receives icon, count, label as props */}
      <div style={styles.statsBar}>
        {stats.map(s => (
          <StatCard key={s.label} icon={s.icon} count={s.count} label={s.label} />
        ))}
      </div>

      {/* SectionHeader receives title + subtitle as props */}
      <SectionHeader
        title="Places We've Explored"
        subtitle="Real trips. Real tourists. Unforgettable memories."
      />

      {/* Trip gallery */}
      <div style={styles.grid}>
        {trips.map((t, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.imgWrap}>
              <img src={t.img} alt={t.place} style={styles.img} />
              <span style={{ ...styles.tag, background: t.tagColor }}>{t.tag}</span>
            </div>
            <div style={styles.cardBody}>
              <h3 style={styles.place}>📍 {t.place}</h3>
              <div style={styles.meta}>
                <span style={styles.metaItem}>📅 {t.date}</span>
                <span style={styles.metaItem}>👥 {t.tourists} tourists</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to be part of our next milestone?</h2>
        <p style={styles.ctaSub}>Join thousands of happy travelers and book your dream trip today.</p>
        <a href="/booking" style={styles.ctaBtn}>Book a Tour ✈️</a>
      </div>

      <Footer />
    </>
  );
}

const styles = {
  hero:        { background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)', color: '#fff', textAlign: 'center', padding: '80px 20px 60px' },
  heroTag:     { fontSize: '11px', letterSpacing: '4px', color: '#ffc107', marginBottom: '12px', fontWeight: 'bold' },
  heroTitle:   { fontSize: '48px', fontWeight: 'bold', margin: '0 0 14px' },
  heroSub:     { fontSize: '16px', color: 'rgba(255,255,255,0.65)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 },
  statsBar:    { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', background: '#0d6efd' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto', padding: '10px 24px 60px' },
  card:        { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.1)', background: '#fff' },
  imgWrap:     { position: 'relative' },
  img:         { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
  tag:         { position: 'absolute', top: '14px', left: '14px', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' },
  cardBody:    { padding: '16px 18px' },
  place:       { fontSize: '16px', fontWeight: 'bold', color: '#0d1b2a', marginBottom: '10px' },
  meta:        { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  metaItem:    { fontSize: '13px', color: '#666' },
  cta:         { background: 'linear-gradient(135deg, #0d1b2a, #1a3a5c)', color: '#fff', textAlign: 'center', padding: '70px 20px' },
  ctaTitle:    { fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' },
  ctaSub:      { fontSize: '16px', color: 'rgba(255,255,255,0.65)', marginBottom: '28px' },
  ctaBtn:      { background: '#ffc107', color: '#000', padding: '14px 36px', borderRadius: '50px', fontWeight: 'bold', textDecoration: 'none', fontSize: '16px' },
};
