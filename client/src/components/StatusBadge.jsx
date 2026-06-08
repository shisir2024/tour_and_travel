import React from 'react';

export default function StatusBadge({ status }) {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          label: status === 'active' ? '🟢 Active' : '✓ Confirmed'
        };
      case 'pending':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: '⌛ Pending'
        };
      case 'in-progress':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          label: '⚡ In Progress'
        };
      case 'completed':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          label: '🎉 Completed'
        };
      case 'cancelled':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          label: '✕ Cancelled'
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.15)',
          color: '#d1d5db',
          border: '1px solid rgba(156, 163, 175, 0.3)',
          label: status || 'Unknown'
        };
    }
  };

  const s = getStyles();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: s.bg,
      color: s.color,
      border: s.border,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  );
}
