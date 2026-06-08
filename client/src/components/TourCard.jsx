import { Link } from 'react-router-dom';

export default function TourCard({ title, desc, img, price, days, rating }) {
  return (
    <div style={styles.card} className="tour-card dark-card">
      <img src={img} alt={title} style={styles.img} loading="lazy" />
      <div style={styles.body}>
        <h5 style={styles.title}>{title}</h5>
        <p style={styles.desc}>{desc}</p>
        {rating && <p style={styles.rating}>{'⭐'.repeat(Math.round(rating))} {rating}</p>}
        {days && <p style={styles.days}>📅 {days}</p>}
        {price && <p style={styles.price}>{price} <span style={styles.pp}>per person</span></p>}
        <Link to="/booking" style={styles.btn}>Book Now →</Link>
      </div>
    </div>
  );
}

const styles = {
  card:   { borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', background: '#fff' },
  img:    { width: '100%', height: '200px', objectFit: 'cover', display: 'block' },
  body:   { padding: '16px' },
  title:  { fontSize: '17px', fontWeight: 'bold', marginBottom: '6px' },
  desc:   { color: '#555', fontSize: '13px', marginBottom: '8px', lineHeight: 1.5 },
  rating: { fontSize: '13px', marginBottom: '4px' },
  days:   { fontSize: '12px', color: '#888', marginBottom: '6px' },
  price:  { fontSize: '18px', fontWeight: 'bold', color: '#0d6efd', marginBottom: '12px' },
  pp:     { fontSize: '12px', color: '#888', fontWeight: 'normal' },
  btn:    { display: 'block', background: '#0d6efd', color: '#fff', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' },
};
