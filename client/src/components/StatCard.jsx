/**
 * StatCard — reusable stat display component
 * Props: icon (string), count (string), label (string)
 */
export default function StatCard({ icon, count, label }) {
  return (
    <div style={styles.item}>
      <span style={styles.icon}>{icon}</span>
      <span style={styles.count}>{count}</span>
      <span style={styles.label}>{label}</span>
    </div>
  );
}

const styles = {
  item:  { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 40px', borderRight: '1px solid rgba(255,255,255,0.15)' },
  icon:  { fontSize: '28px', marginBottom: '6px' },
  count: { fontSize: '30px', fontWeight: 'bold', color: '#fff' },
  label: { fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' },
};
