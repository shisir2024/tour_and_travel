import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    boxSizing: 'border-box',
    animation: 'fadeIn 0.25s ease-out'
  },
  content: {
    background: 'rgba(17, 24, 39, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    color: '#d1d5db',
    boxSizing: 'border-box'
  }
};
