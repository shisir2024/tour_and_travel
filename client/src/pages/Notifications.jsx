import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function Notifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/notifications/my', { token });
      if (res?.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT', token });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Could not mark alert as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT', token });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Could not complete request.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Inbox...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
    <div style={styles.page}>
      <Toaster position="top-right" />
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🔔 System Notifications</h1>
            <p style={styles.subtitle}>Stay updated with booking requests, cancellations, and route guide changes.</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button style={styles.markAllBtn} onClick={handleMarkAllRead}>
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {/* Notif cards */}
        {notifications.length === 0 ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>📬</div>
            <p style={styles.emptyText}>No notifications here yet.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {notifications.map(notif => (
              <div key={notif._id} style={styles.card(notif.isRead)}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle(notif.isRead)}>{notif.title}</h3>
                  {!notif.isRead && (
                    <button style={styles.readBtn} onClick={() => handleMarkRead(notif._id)}>
                      Mark Read
                    </button>
                  )}
                </div>
                <p style={styles.cardMsg}>{notif.message}</p>
                <div style={styles.cardTime}>{new Date(notif.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)',
    color: '#fff',
    padding: '40px 20px',
    boxSizing: 'border-box'
  },
  glow1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '350px',
    height: '350px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    pointerEvents: 'none'
  },
  glow2: {
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    width: '400px',
    height: '400px',
    background: 'rgba(236, 72, 153, 0.06)',
    borderRadius: '50%',
    filter: 'blur(110px)',
    pointerEvents: 'none'
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    zIndex: 2,
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800'
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#9ca3af',
    fontSize: '14px'
  },
  markAllBtn: {
    padding: '10px 20px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    color: '#a5b4fc',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(99, 102, 241, 0.2)'
    }
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: (isRead) => ({
    background: isRead ? 'rgba(17, 24, 39, 0.4)' : 'rgba(17, 24, 39, 0.75)',
    borderLeft: `4px solid ${isRead ? 'rgba(255, 255, 255, 0.1)' : '#818cf8'}`,
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(12px)',
    boxShadow: isRead ? 'none' : '0 10px 20px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease'
  }),
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  cardTitle: (isRead) => ({
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: isRead ? '#d1d5db' : '#fff'
  }),
  readBtn: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    padding: 0
  },
  cardMsg: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#9ca3af',
    lineHeight: '1.5'
  },
  cardTime: {
    fontSize: '11px',
    color: '#6b7280'
  },
  emptyWrap: {
    textAlign: 'center',
    padding: '60px 0',
    background: 'rgba(17, 24, 39, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    margin: 0
  },
  loadingWrap: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030712'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(129, 140, 248, 0.1)',
    borderTopColor: '#818cf8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};
