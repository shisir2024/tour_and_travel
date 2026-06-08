import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useFadeIn } from '../hooks/useFadeIn';
import { Link, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';
import Modal from '../components/Modal';
import toast, { Toaster } from 'react-hot-toast';

const statusColor = { 
  pending: '#ffc107', 
  confirmed: '#10b981', 
  'in-progress': '#3b82f6', 
  completed: '#8b5cf6', 
  cancelled: '#ef4444' 
};

export default function MyBookings() {
  usePageTitle('My Bookings');
  const { userName, token } = useAuth();
  const location = useLocation();
  const highlightId = location.state?.highlightBookingId;

  const [bookings,   setBookings]     = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [error,      setError]        = useState('');
  const [cancelling, setCancelling]   = useState(null);
  
  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingBooking, setPayingBooking] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const ref = useFadeIn();

  const loadBookings = async () => {
    try {
      const res = await apiFetch('/bookings/client/mine', { token });
      if (res?.data) {
        setBookings(res.data);
      }
    } catch (err) {
      setError('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token]);

  // Socket listener for live status/payment updates
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (updatedBooking) => {
      setBookings(prev => 
        prev.map(b => b._id === updatedBooking._id ? {
          ...b,
          status: updatedBooking.status,
          paymentStatus: updatedBooking.paymentStatus
        } : b)
      );
      toast.success(`Trip to ${updatedBooking.tourId?.destination || 'Destination'} updated to ${updatedBooking.status}!`);
    };

    socket.on('booking-status-updated', handleStatusUpdate);

    return () => {
      socket.off('booking-status-updated', handleStatusUpdate);
    };
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await apiFetch(`/bookings/client/${id}/cancel`, { method: 'PUT', token });
      toast.success('Booking cancelled successfully.');
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      toast.error(err.message || 'Could not cancel. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const handleOpenPayment = (booking) => {
    setPayingBooking(booking);
    setShowPayModal(true);
  };

  const handleSimulatePayment = async (status) => {
    if (!payingBooking) return;
    setProcessingPayment(true);
    try {
      await apiFetch(`/bookings/client/${payingBooking._id}/pay`, {
        method: 'PUT',
        body: { paymentStatus: status },
        token
      });

      if (status === 'paid') {
        toast.success('💳 Payment Approved! Your trip is now confirmed.');
        setBookings(prev => 
          prev.map(b => b._id === payingBooking._id ? { ...b, paymentStatus: 'paid', status: 'confirmed' } : b)
        );
      } else {
        toast.error('❌ Payment Rejected. Please check details and try again.');
        setBookings(prev => 
          prev.map(b => b._id === payingBooking._id ? { ...b, paymentStatus: 'failed' } : b)
        );
      }
      setShowPayModal(false);
      setPayingBooking(null);
    } catch (err) {
      toast.error('Payment processing error.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderStatusTimeline = (currentStatus) => {
    const steps = ['pending', 'confirmed', 'in-progress', 'completed'];
    const activeIndex = steps.indexOf(currentStatus.toLowerCase());

    if (currentStatus.toLowerCase() === 'cancelled') {
      return (
        <div style={s.timelineContainer}>
          <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '13px' }}>🛑 Booking Cancelled</span>
        </div>
      );
    }

    return (
      <div style={s.timelineContainer}>
        {steps.map((step, index) => {
          const isDone = index <= activeIndex;
          const label = step.replace('-', ' ').toUpperCase();
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flexGrow: index < steps.length - 1 ? 1 : 0 }}>
              <div style={s.stepBubble(isDone)}>
                {index + 1}
                <span style={s.stepLabel(isDone)}>{label}</span>
              </div>
              {index < steps.length - 1 && <div style={s.stepLine(index < activeIndex)} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={s.hero}>
        <p style={s.tag}>MY ACCOUNT</p>
        <h1 style={s.title}>My Bookings 🗺️</h1>
        <p style={s.sub}>Hello {userName}, here are all your booked tours.</p>
      </div>

      <div ref={ref} className="fade-in" style={s.page}>
        <div style={s.container}>

          {loading && (
            <div style={s.centered}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} style={s.skeletonCard}>
                  <div className="skeleton" style={{ height: '20px', width: '40%', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '50%' }} />
                </div>
              ))}
            </div>
          )}

          {!loading && error && <p style={s.error}>{error}</p>}

          {!loading && !error && bookings.length === 0 && (
            <div style={s.empty}>
              <p style={s.emptyIcon}>🧳</p>
              <h3 style={{ color: '#fff' }}>No bookings yet!</h3>
              <p style={{ color: '#888', marginBottom: '20px' }}>You haven't booked any tours yet.</p>
              <Link to="/booking" style={s.bookBtn}>Book a Tour Now →</Link>
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div style={s.grid}>
              {bookings.map((b) => {
                const isHighlighted = b._id === highlightId;
                return (
                  <div 
                    key={b._id} 
                    style={{ 
                      ...s.card, 
                      border: isHighlighted ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isHighlighted ? '0 0 20px rgba(129, 140, 248, 0.3)' : '0 4px 16px rgba(0,0,0,0.4)'
                    }} 
                    className="dark-card tour-card"
                  >
                    <div style={s.cardTop}>
                      <h3 style={s.dest}>📍 {b.tourId?.destination || 'Custom Destination'}</h3>
                      <span style={{ ...s.statusBadge, background: statusColor[b.status] || '#ffc107' }}>
                        {b.status || 'pending'}
                      </span>
                    </div>

                    <div style={s.info}>
                      <p>📦 <strong>Package:</strong> {b.tourId?.tourName || 'Tour Package'}</p>
                      <p>👥 <strong>Travelers:</strong> {b.numberOfPeople} people</p>
                      <p>💰 <strong>Total Amount:</strong> ₹{b.totalAmount.toLocaleString('en-IN')}</p>
                      <p>📅 <strong>Travel Dates:</strong> {b.tourId ? `${new Date(b.tourId.startDate).toLocaleDateString()} - ${new Date(b.tourId.endDate).toLocaleDateString()}` : 'N/A'}</p>
                      <p>⏱️ <strong>Duration:</strong> {b.tourId?.duration || 'N/A'}</p>
                      <p>📅 <strong>Booked on:</strong> {new Date(b.createdAt).toLocaleDateString()}</p>
                      <div style={s.payStatusBox}>
                        <span>💳 <strong>Payment Status:</strong> </span>
                        <span style={{ 
                          color: b.paymentStatus === 'paid' ? '#34d399' : b.paymentStatus === 'failed' ? '#f87171' : '#fbbf24',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          marginLeft: '6px'
                        }}>
                          {b.paymentStatus || 'pending'}
                        </span>
                      </div>
                    </div>

                    <div style={s.timelineBox}>
                      <p style={s.timelineTitle}>✈️ Trip Status Timeline</p>
                      {renderStatusTimeline(b.status)}
                    </div>

                    <div style={s.cardActions}>
                      {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && (
                        <button
                          style={s.payBtn}
                          onClick={() => handleOpenPayment(b)}
                        >
                          💳 Pay Now (₹{b.totalAmount.toLocaleString('en-IN')})
                        </button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          style={{ ...s.cancelBtn, opacity: cancelling === b._id ? 0.6 : 1 }}
                          disabled={cancelling === b._id}
                          onClick={() => handleCancel(b._id)}
                        >
                          {cancelling === b._id ? 'Cancelling...' : '✕ Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Payment simulation modal */}
      <Modal 
        isOpen={showPayModal} 
        onClose={() => !processingPayment && setShowPayModal(false)}
        title="Secure Checkout (Simulated Razorpay Gateway)"
      >
        {payingBooking && (
          <div style={s.payForm}>
            <div style={s.payMeta}>
              <p style={{ margin: '0 0 8px 0' }}>Booking ID: <code>{payingBooking._id}</code></p>
              <h3 style={{ margin: 0, color: '#a5b4fc' }}>📍 Tour to {payingBooking.tourId?.destination}</h3>
              <p style={{ margin: '6px 0 0 0', color: '#9ca3af' }}>{payingBooking.tourId?.tourName} ({payingBooking.numberOfPeople} traveler(s))</p>
            </div>

            <div style={s.checkoutTotal}>
              <span>Amount Due:</span>
              <strong style={{ color: '#10b981', fontSize: '24px' }}>₹{payingBooking.totalAmount.toLocaleString('en-IN')}</strong>
            </div>

            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>
              Select a simulated checkout status to test Razorpay integration readiness.
            </p>

            <div style={s.payActionRow}>
              <button 
                style={s.checkoutBtn('#10b981')}
                disabled={processingPayment}
                onClick={() => handleSimulatePayment('paid')}
              >
                {processingPayment ? 'Processing...' : '✔ Approve Payment (Success)'}
              </button>
              <button 
                style={s.checkoutBtn('#ef4444')}
                disabled={processingPayment}
                onClick={() => handleSimulatePayment('failed')}
              >
                {processingPayment ? 'Processing...' : '✕ Decline Payment (Fail)'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </>
  );
}

const s = {
  hero:        { background: 'linear-gradient(135deg,#0d1b2a,#1a3a5c)', color: '#fff', textAlign: 'center', padding: '75px 20px 55px' },
  tag:         { fontSize: '11px', letterSpacing: '4px', color: '#ffc107', marginBottom: '10px', fontWeight: 'bold' },
  title:       { fontSize: '42px', fontWeight: 'bold', margin: '0 0 10px' },
  sub:         { fontSize: '16px', color: 'rgba(255,255,255,0.65)' },
  page:        { background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)', minHeight: '60vh', padding: '50px 20px' },
  container:   { maxWidth: '1100px', margin: '0 auto' },
  centered:    { display: 'flex', flexDirection: 'column', gap: '16px' },
  skeletonCard:{ background: 'rgba(17, 24, 39, 0.65)', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' },
  error:       { color: '#ef4444', textAlign: 'center', padding: '40px' },
  empty:       { textAlign: 'center', padding: '60px 20px' },
  emptyIcon:   { fontSize: '60px', marginBottom: '16px' },
  bookBtn:     { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', padding: '12px 28px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: '24px' },
  card:        { background: 'rgba(17, 24, 39, 0.65)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(12px)', boxSizing: 'border-box' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  dest:        { fontSize: '19px', fontWeight: 'bold', color: '#fff', margin: 0 },
  statusBadge: { fontSize: '11px', fontWeight: 'bold', color: '#fff', padding: '4px 12px', borderRadius: '20px', textTransform: 'capitalize' },
  info:        { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#d1d5db', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' },
  payStatusBox:{ display: 'flex', alignItems: 'center', marginTop: '4px' },
  timelineBox: { marginBottom: '24px' },
  timelineTitle:{ fontSize: '13px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' },
  timelineContainer: { display: 'flex', alignItems: 'center', width: '100%', padding: '0 10px', boxSizing: 'border-box' },
  stepBubble: (active) => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${active ? '#818cf8' : 'rgba(255, 255, 255, 0.1)'}`,
    color: active ? '#fff' : '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    position: 'relative'
  }),
  stepLabel: (active) => ({
    position: 'absolute',
    top: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '9px',
    fontWeight: '700',
    color: active ? '#a5b4fc' : '#4b5563',
    whiteSpace: 'nowrap'
  }),
  stepLine: (active) => ({
    flexGrow: 1,
    height: '2px',
    backgroundColor: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
    margin: '0 4px'
  }),
  cardActions: { display: 'flex', flexDirection: 'column', gap: '10px' },
  payBtn:      { width: '100%', padding: '11px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  cancelBtn:   { width: '100%', padding: '10px', background: 'transparent', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  
  // Checkout Modal
  payForm:     { display: 'flex', flexDirection: 'column', gap: '16px', color: '#fff' },
  payMeta:     { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' },
  checkoutTotal:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)' },
  payActionRow:{ display: 'flex', gap: '14px' },
  checkoutBtn: (color) => ({
    flex: 1,
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: `1.5px solid ${color}`,
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
    ':hover': {
      backgroundColor: color
    }
  })
};
