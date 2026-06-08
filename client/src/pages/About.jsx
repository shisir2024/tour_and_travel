import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';
import { useFadeIn } from '../hooks/useFadeIn';
import { Link } from 'react-router-dom';

const team = [
  { name: 'Arjun Sharma',  role: 'CEO & Founder',      emoji: '👨‍💼' },
  { name: 'Priya Mehta',   role: 'Head of Operations', emoji: '👩‍💼' },
  { name: 'Rahul Singh',   role: 'Lead Travel Expert', emoji: '🧑‍✈️' },
  { name: 'Sneha Patel',   role: 'Customer Success',   emoji: '👩‍💻' },
];

export default function About() {
  usePageTitle('About Us');
  const heroRef  = useFadeIn();
  const teamRef  = useFadeIn();
  const valRef   = useFadeIn();

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={s.hero}>
        <p style={s.tag}>ABOUT US</p>
        <h1 style={s.heroTitle} className="hero-title">We Live & Breathe Travel ✈️</h1>
        <p style={s.heroSub} className="hero-sub">Turning your dream destinations into real, unforgettable memories since 2012.</p>
      </div>

      {/* Story */}
      <section ref={heroRef} className="fade-in dark-section" style={s.section}>
        <div style={s.container}>
          <div style={s.row}>
            <div style={s.left}>
              <p style={s.sTag}>OUR STORY</p>
              <h2 style={s.heading}>Welcome to MyTripAgency</h2>
              <p style={s.text}>Founded in 2012, MyTripAgency has helped over 5,000 travelers explore 48+ countries across 6 continents. We believe every journey should be seamless, safe, and spectacular.</p>
              <p style={s.text}>From budget backpacking to luxury getaways, our expert team crafts tailor-made experiences that match your personality, pace, and pocket.</p>
              <div style={s.statRow}>
                {[['48+','Countries'],['5000+','Travelers'],['320+','Tours'],['12+','Years']].map(([n,l]) => (
                  <div key={l} style={s.stat}><strong style={{ color:'#0d6efd', fontSize:'22px' }}>{n}</strong><span style={{ fontSize:'12px', color:'#888' }}>{l}</span></div>
                ))}
              </div>
              <Link to="/booking" style={s.btn}>Explore Tours →</Link>
            </div>
            <div style={s.right}>
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e" alt="Travel" style={s.img} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={valRef} className="fade-in" style={{ ...s.section, background:'linear-gradient(135deg,#0d1b2a,#1a3a5c)', padding:'60px 20px' }}>
        <div style={s.container}>
          <p style={{ ...s.sTag, color:'#ffc107' }}>OUR VALUES</p>
          <h2 style={{ ...s.heading, color:'#fff', marginBottom:'36px' }}>What Drives Us Every Day</h2>
          <div style={s.valGrid}>
            {[['🌍','Global Reach','Access to 48+ countries and 320+ curated packages worldwide.'],
              ['🛡️','Safety First','Every tour is fully insured with emergency support 24/7.'],
              ['💚','Sustainable Travel','We promote eco-friendly tourism and responsible travel.'],
              ['❤️','Customer Love','5,000+ happy travelers can\'t be wrong — your joy is our mission.'],
            ].map(([icon,title,desc]) => (
              <div key={title} style={s.valCard}>
                <span style={{ fontSize:'32px' }}>{icon}</span>
                <h3 style={{ color:'#fff', margin:'10px 0 6px' }}>{title}</h3>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'14px', lineHeight:1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section ref={teamRef} className="fade-in dark-section" style={{ ...s.section, background:'#f8fafc' }}>
        <div style={s.container}>
          <p style={s.sTag}>MEET THE TEAM</p>
          <h2 style={{ ...s.heading, marginBottom:'36px' }}>The People Behind Your Adventures</h2>
          <div style={s.teamGrid}>
            {team.map(m => (
              <div key={m.name} style={s.teamCard} className="dark-card tour-card">
                <div style={s.avatar}>{m.emoji}</div>
                <h3 style={{ fontWeight:'bold', marginBottom:'4px' }}>{m.name}</h3>
                <p style={{ color:'#0d6efd', fontSize:'13px' }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

const s = {
  hero:     { background:'linear-gradient(135deg,#0d1b2a,#1a3a5c)', color:'#fff', textAlign:'center', padding:'80px 20px 60px' },
  tag:      { fontSize:'11px', letterSpacing:'4px', color:'#ffc107', marginBottom:'12px', fontWeight:'bold' },
  heroTitle:{ fontSize:'clamp(28px,5vw,48px)', fontWeight:'bold', margin:'0 0 14px' },
  heroSub:  { fontSize:'16px', color:'rgba(255,255,255,0.65)', maxWidth:'600px', margin:'0 auto' },
  section:  { padding:'70px 20px', background:'#fff' },
  container:{ maxWidth:'1100px', margin:'0 auto' },
  row:      { display:'flex', gap:'48px', flexWrap:'wrap', alignItems:'center' },
  left:     { flex:1, minWidth:'280px' },
  right:    { flex:1, minWidth:'280px' },
  sTag:     { fontSize:'11px', letterSpacing:'3px', color:'#0d6efd', fontWeight:'bold', marginBottom:'10px' },
  heading:  { fontSize:'clamp(22px,3vw,30px)', fontWeight:'bold', color:'#0d1b2a', marginBottom:'16px' },
  text:     { fontSize:'16px', lineHeight:1.8, color:'#444', marginBottom:'14px' },
  statRow:  { display:'flex', gap:'20px', flexWrap:'wrap', margin:'20px 0 24px' },
  stat:     { display:'flex', flexDirection:'column', alignItems:'center' },
  btn:      { background:'#0d6efd', color:'#fff', border:'none', padding:'12px 30px', borderRadius:'50px', fontWeight:'bold', cursor:'pointer', fontSize:'15px', textDecoration:'none', display:'inline-block' },
  img:      { width:'100%', maxHeight:'380px', objectFit:'cover', borderRadius:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.15)' },
  valGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'24px' },
  valCard:  { background:'rgba(255,255,255,0.06)', borderRadius:'14px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center' },
  teamGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'20px' },
  teamCard: { background:'#fff', borderRadius:'14px', padding:'28px 20px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' },
  avatar:   { fontSize:'52px', marginBottom:'12px' },
};
