import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';
import StatusBadge from '../components/StatusBadge';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function StaffDashboard() {
  const { token, userName } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalTours: 0,
    totalCustomers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    recentBookings: [],
    activeTours: []
  });

  const [contacts, setContacts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'contacts', 'newsletter'
  const [loading, setLoading] = useState(true);
  const [liveFeed, setLiveFeed] = useState([]);

  const loadAllDashboardData = async () => {
    try {
      const [statsRes, contactsRes, subscribersRes] = await Promise.all([
        apiFetch('/stats/staff', { token }),
        apiFetch('/contact', { token }),
        apiFetch('/newsletter', { token })
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
        setLiveFeed(statsRes.data.recentBookings || []);
      }
      if (contactsRes?.data) {
        setContacts(contactsRes.data);
      }
      if (subscribersRes?.data) {
        setSubscribers(subscribersRes.data);
      }
    } catch (err) {
      toast.error('Error loading dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllDashboardData();
    }
  }, [token]);

  // Real-time Socket.IO synchronization for staff dashboard
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();

    const handleBookingCreated = (newBooking) => {
      // Add to live feed
      setLiveFeed(prev => [newBooking, ...prev.slice(0, 9)]);
      
      // Update counts
      setStats(prev => ({
        ...prev,
        totalBookings: prev.totalBookings + 1,
        pendingBookings: prev.pendingBookings + 1,
        totalRevenue: prev.totalRevenue + newBooking.totalAmount
      }));

      toast(`📢 New booking received from ${newBooking.customerId?.name || 'Client'}!`, {
        icon: '✈️',
        duration: 5000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold'
        }
      });
    };

    const handleBookingUpdated = (updatedBooking) => {
      // Update in feed
      setLiveFeed(prev => prev.map(b => b._id === updatedBooking._id ? updatedBooking : b));
      
      // Recalculate stats counts if status changed
      loadAllDashboardData();
      
      toast.info(`ℹ️ Booking status updated for ${updatedBooking.customerId?.name || 'Client'}.`);
    };

    const handleNewNotification = (data) => {
      // If notification is signup or contact, update counts/data
      if (data.title?.toLowerCase().includes('signup') || data.title?.toLowerCase().includes('register')) {
        setStats(prev => ({ ...prev, totalCustomers: prev.totalCustomers + 1 }));
      }
      loadAllDashboardData();
    };

    socket.on('booking-created', handleBookingCreated);
    socket.on('booking-updated', handleBookingUpdated);
    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('booking-created', handleBookingCreated);
      socket.off('booking-updated', handleBookingUpdated);
      socket.off('new-notification', handleNewNotification);
    };
  }, [token]);

  // Exporter for CSV subscriber list
  const exportSubscribersCSV = () => {
    if (subscribers.length === 0) {
      toast.error('No subscribers to export.');
      return;
    }
    
    const headers = ['Email Address', 'Subscription Date'];
    const rows = subscribers.map(sub => [
      sub.email,
      new Date(sub.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📊 Subscribers CSV exported successfully!');
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={styles.page}>
        <div style={styles.glow1} />
        <div style={styles.glow2} />
        
        <div style={styles.container}>
          {/* Welcome Section */}
          <div style={styles.welcomeBanner}>
            <div>
              <h1 style={styles.title}>Welcome Back, {userName}! 👋</h1>
              <p style={styles.subtitle}>Here is your travel agency overview for today.</p>
            </div>
            <div style={styles.roleBadge}>👷 Staff Account</div>
          </div>

          {/* Navigation Tabs */}
          <div style={styles.tabsContainer}>
            <button 
              style={styles.tabBtn(activeTab === 'metrics')} 
              onClick={() => setActiveTab('metrics')}
            >
              📊 Stats & Live Feed
            </button>
            <button 
              style={styles.tabBtn(activeTab === 'contacts')} 
              onClick={() => setActiveTab('contacts')}
            >
              📬 Contacts Desk ({contacts.length})
            </button>
            <button 
              style={styles.tabBtn(activeTab === 'newsletter')} 
              onClick={() => setActiveTab('newsletter')}
            >
              📧 Subscribers ({subscribers.length})
            </button>
          </div>

          {activeTab === 'metrics' && (
            <>
              {/* Stats Grid */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard('rgba(99, 102, 241, 0.1)')}>
                  <div style={styles.statIcon}>🗺️</div>
                  <div>
                    <div style={styles.statLabel}>Total Tours</div>
                    <div style={styles.statValue}>{stats.totalTours}</div>
                  </div>
                </div>

                <div style={styles.statCard('rgba(236, 72, 153, 0.1)')}>
                  <div style={styles.statIcon}>👥</div>
                  <div>
                    <div style={styles.statLabel}>Total Customers</div>
                    <div style={styles.statValue}>{stats.totalCustomers}</div>
                  </div>
                </div>

                <div style={styles.statCard('rgba(16, 185, 129, 0.1)')}>
                  <div style={styles.statIcon}>📋</div>
                  <div>
                    <div style={styles.statLabel}>Total Bookings</div>
                    <div style={styles.statValue}>{stats.totalBookings}</div>
                  </div>
                </div>

                <div style={styles.statCard('rgba(245, 158, 11, 0.1)')}>
                  <div style={styles.statIcon}>🪙</div>
                  <div>
                    <div style={styles.statLabel}>Total Revenue</div>
                    <div style={styles.statValue}>₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Sub-stats (Pending & Confirmed) */}
              <div style={styles.subStatsRow}>
                <div style={styles.subStatsCard}>
                  ⏳ Pending Bookings: <strong>{stats.pendingBookings || 0}</strong>
                </div>
                <div style={styles.subStatsCard}>
                  ✅ Confirmed/Approved: <strong>{stats.confirmedBookings || 0}</strong>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.quickActions}>
                <h3 style={styles.sectionHeader}>⚡ Quick Manager Actions</h3>
                <div style={styles.actionButtons}>
                  <button style={styles.actionBtn('#6366f1')} onClick={() => navigate('/tours?action=new')}>
                    ➕ Add New Tour
                  </button>
                  <button style={styles.actionBtn('#ec4899')} onClick={() => navigate('/customers?action=new')}>
                    👤 Add Customer
                  </button>
                  <button style={styles.actionBtn('#10b981')} onClick={() => navigate('/bookings?action=new')}>
                    📋 Create Booking
                  </button>
                </div>
              </div>

              {/* Main Content Split Grid */}
              <div style={styles.contentSplit}>
                {/* Active Tours */}
                <div style={styles.glassPanel}>
                  <div style={styles.panelHeader}>
                    <h3 style={styles.panelTitle}>🟢 Active Tours</h3>
                    <button style={styles.linkBtn} onClick={() => navigate('/tours')}>View All</button>
                  </div>
                  <div style={styles.panelBody}>
                    {stats.activeTours.length === 0 ? (
                      <p style={styles.emptyText}>No active tours right now.</p>
                    ) : (
                      stats.activeTours.map(tour => (
                        <div key={tour._id} style={styles.tourListItem}>
                          <div>
                            <div style={styles.tourName}>{tour.tourName}</div>
                            <div style={styles.tourInfo}>📍 {tour.destination} • 📅 {new Date(tour.startDate).toLocaleDateString()}</div>
                          </div>
                          <div style={styles.guideName}>
                            Guide: {tour.assignedGuide ? `👤 ${tour.assignedGuide.name}` : '❌ Unassigned'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Live Booking Feed */}
                <div style={styles.glassPanel}>
                  <div style={styles.panelHeader}>
                    <h3 style={styles.panelTitle}>📢 Live Booking Feed (Real-Time)</h3>
                    <button style={styles.linkBtn} onClick={() => navigate('/bookings')}>View All</button>
                  </div>
                  <div style={styles.panelBody}>
                    {liveFeed.length === 0 ? (
                      <p style={styles.emptyText}>No recent booking activity.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {liveFeed.map(bk => (
                          <div key={bk._id} style={styles.liveFeedItem}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>👤 {bk.customerId?.name || bk.userId?.name || 'Client / Tourist'}</strong>
                              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>₹{bk.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>
                              <span>✈️ {bk.tourId?.tourName || 'Tour Package'}</span>
                              <StatusBadge status={bk.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'contacts' && (
            <div style={styles.glassPanel}>
              <h3 style={styles.panelTitle}>📬 Customer Inquiries & Messages</h3>
              {contacts.length === 0 ? (
                <p style={styles.emptyText}>No customer messages found.</p>
              ) : (
                <div style={styles.contactList}>
                  {contacts.map(msg => (
                    <div key={msg._id} style={styles.contactItem}>
                      <div style={styles.contactHeader}>
                        <strong>👤 {msg.name}</strong>
                        <span style={{ color: '#818cf8', fontSize: '13px' }}>✉ {msg.email}</span>
                      </div>
                      <p style={styles.contactSubject}><strong>Subject:</strong> {msg.subject}</p>
                      <p style={styles.contactBody}>"{msg.message}"</p>
                      <span style={styles.contactDate}>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div style={styles.glassPanel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>📧 Newsletter Subscriber Database</h3>
                <button style={styles.exportBtn} onClick={exportSubscribersCSV}>
                  📊 Export CSV List
                </button>
              </div>
              
              {subscribers.length === 0 ? (
                <p style={styles.emptyText}>No subscribers registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Email Address</th>
                        <th style={styles.th}>Subscription Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map(sub => (
                        <tr key={sub._id} style={styles.tr}>
                          <td style={styles.td}>✉ {sub.email}</td>
                          <td style={styles.td}>{new Date(sub.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  glow1: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '400px',
    height: '400px',
    background: 'rgba(99, 102, 241, 0.12)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    pointerEvents: 'none',
    zIndex: 1
  },
  glow2: {
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    width: '450px',
    height: '450px',
    background: 'rgba(236, 72, 153, 0.08)',
    borderRadius: '50%',
    filter: 'blur(110px)',
    pointerEvents: 'none',
    zIndex: 1
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    zIndex: 2,
    position: 'relative'
  },
  welcomeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '24px 32px',
    backdropFilter: 'blur(10px)',
    marginBottom: '28px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#9ca3af',
    fontSize: '14px'
  },
  roleBadge: {
    padding: '8px 16px',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#a5b4fc',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '14px'
  },
  
  // Tabs styling
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '28px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '12px'
  },
  tabBtn: (active) => ({
    padding: '10px 20px',
    backgroundColor: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.04)',
    color: '#fff',
    border: `1px solid ${active ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  }),

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  statCard: (bgGlow) => ({
    background: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: `inset 0 0 16px ${bgGlow}, 0 10px 30px rgba(0,0,0,0.2)`
  }),
  statIcon: {
    fontSize: '32px',
    background: 'rgba(255,255,255,0.05)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    marginTop: '4px',
    color: '#fff'
  },
  
  subStatsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '28px'
  },
  subStatsCard: {
    flex: 1,
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#d1d5db'
  },

  quickActions: {
    background: 'rgba(17, 24, 39, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    backdropFilter: 'blur(10px)'
  },
  sectionHeader: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#e5e7eb',
    letterSpacing: '-0.2px'
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  actionBtn: (color) => ({
    padding: '12px 24px',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    color: '#fff',
    border: `1px solid ${color}`,
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 12px ${color}1a`,
    outline: 'none'
  }),
  contentSplit: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '30px'
  },
  glassPanel: {
    background: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px'
  },
  panelTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#f3f4f6'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#818cf8',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    padding: 0,
    outline: 'none'
  },
  exportBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px'
  },
  panelBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  tourListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px'
  },
  tourName: {
    fontWeight: '600',
    fontSize: '15px'
  },
  tourInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  guideName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#a5b4fc',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 10px',
    borderRadius: '6px'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px 0'
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
  },

  // Live feed styling
  liveFeedItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '14px 16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },

  // Contacts desk styling
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  contactItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    color: '#d1d5db'
  },
  contactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
    marginBottom: '10px'
  },
  contactSubject: {
    margin: '0 0 8px 0',
    fontSize: '14px'
  },
  contactBody: {
    margin: '0 0 12px 0',
    fontStyle: 'italic',
    lineHeight: '1.5',
    color: '#9ca3af',
    background: 'rgba(0,0,0,0.1)',
    padding: '10px',
    borderRadius: '8px'
  },
  contactDate: {
    fontSize: '11px',
    color: '#6b7280'
  },

  // Subscribers Table styling
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeaderRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  th: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '600',
    paddingBottom: '10px',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
  },
  td: {
    padding: '14px 0',
    fontSize: '14px',
    color: '#d1d5db'
  }
};
