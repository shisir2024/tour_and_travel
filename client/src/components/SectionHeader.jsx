/**
 * SectionHeader — reusable centered section heading
 * Props: title (string), subtitle (string)
 */
export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>{title}</h2>
      {subtitle && <p style={styles.sub}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  wrap:  { textAlign: 'center', padding: '50px 20px 24px' },
  title: { fontSize: '34px', fontWeight: 'bold', color: '#0d1b2a', marginBottom: '8px' },
  sub:   { fontSize: '15px', color: '#666', margin: 0 },
};
