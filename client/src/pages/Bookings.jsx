import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function Bookings() {
  const { token } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    customerId: '',
    tourId: '',
    numberOfPeople: 1,
    bookingDate: new Date().toISOString().split('T')[0]
  });

  const [selectedTourPrice, setSelectedTourPrice] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchData = async () => {
    try {
      const [bookingsRes, customersRes, toursRes] = await Promise.all([
        apiFetch('/bookings', { token }),
        apiFetch('/customers', { token }),
        apiFetch('/tours', { token })
      ]);
      if (bookingsRes?.data) setBookings(bookingsRes.data);
      if (customersRes?.data) setCustomers(customersRes.data);
      if (toursRes?.data) setTours(toursRes.data);
    } catch (err) {
      toast.error('Failed to load booking dashboard details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleOpenAdd();
    }
  }, [location.search]);

  // Recalculate price
  useEffect(() => {
    const tour = tours.find(t => t._id === form.tourId);
    const price = tour ? tour.price : 0;
    setSelectedTourPrice(price);
    setTotalAmount(price * form.numberOfPeople);
  }, [form.tourId, form.numberOfPeople, tours]);

  const handleOpenAdd = () => {
    setForm({
      customerId: '',
      tourId: '',
      numberOfPeople: 1,
      bookingDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.tourId || form.numberOfPeople <= 0) {
      toast.error('Please fill all fields with valid values.');
      return;
    }
    try {
      await apiFetch('/bookings', {
        method: 'POST',
        body: form,
        token
      });
      toast.success('Booking created successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error creating booking.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiFetch(`/bookings/${id}/status`, {
        method: 'PUT',
        body: { status },
        token
      });
      toast.success(`Booking status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error updating status.');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiFetch(`/bookings/${id}`, { method: 'DELETE', token });
      toast.success('Booking cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Error cancelling booking.');
    }
  };

  // Stepper UI helper
  const renderStepper = (currentStatus) => {
    const steps = ['pending', 'confirmed', 'in-progress', 'completed'];
    const activeIndex = steps.indexOf(currentStatus.toLowerCase());
    
    if (currentStatus.toLowerCase() === 'cancelled') {
      return (
        <div style={styles.stepperContainer}>
          <span style={{ color: '#f87171', fontWeight: '700', fontSize: '12px' }}>🛑 Booking Cancelled</span>
        </div>
      );
    }

    return (
      <div style={styles.stepperContainer}>
        {steps.map((step, index) => {
          const isDone = index <= activeIndex;
          const label = step.replace('-', ' ').toUpperCase();
          return (
            <React.Fragment key={step}>
              <div style={styles.stepBubble(isDone)}>
                {index + 1}
                <span style={styles.stepLabel(isDone)}>{label}</span>
              </div>
              {index < steps.length - 1 && <div style={styles.stepLine(index < activeIndex)} />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Bookings...</p>
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
            <h1 style={styles.title}>📋 Booking Desk</h1>
            <p style={styles.subtitle}>Register new passengers, assign packages, and track active statuses.</p>
          </div>
          <button style={styles.addBtn} onClick={handleOpenAdd}>
            📋 Create Booking
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyText}>No reservations recorded yet.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {bookings.map(bk => (
              <div key={bk._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.custName}>👤 {bk.customerId?.name || 'Unknown Customer'}</h3>
                    <p style={styles.tourLabel}>✈️ {bk.tourId?.tourName || 'Deleted TourPackage'}</p>
                  </div>
                  <div style={styles.priceSection}>
                    <span style={styles.amount}>₹{(bk.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span style={styles.qty}>{bk.numberOfPeople} traveler(s)</span>
                  </div>
                </div>

                {/* Workflow Stepper */}
                <div style={styles.stepperBox}>
                  {renderStepper(bk.status)}
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.metaBox}>
                    <span>📅 <strong>Travel Date:</strong> {new Date(bk.bookingDate).toLocaleDateString()}</span>
                    <span>👤 <strong>Booked By:</strong> {bk.bookedBy?.name || 'Staff'}</span>
                  </div>
                  
                  <div style={styles.actions}>
                    {bk.status !== 'cancelled' && bk.status !== 'completed' && (
                      <>
                        {bk.status === 'pending' && (
                          <button style={styles.actionBtn('#10b981')} onClick={() => handleUpdateStatus(bk._id, 'confirmed')}>
                            Confirm Booking
                          </button>
                        )}
                        {bk.status === 'confirmed' && (
                          <button style={styles.actionBtn('#3b82f6')} onClick={() => handleUpdateStatus(bk._id, 'in-progress')}>
                            Mark In Progress
                          </button>
                        )}
                        {bk.status === 'in-progress' && (
                          <button style={styles.actionBtn('#8b5cf6')} onClick={() => handleUpdateStatus(bk._id, 'completed')}>
                            Complete Tour
                          </button>
                        )}
                        <button style={styles.cancelBtn} onClick={() => handleCancelBooking(bk._id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Reservation">
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Customer</label>
            <select name="customerId" required style={styles.select} value={form.customerId} onChange={handleFormChange}>
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Tour Package</label>
            <select name="tourId" required style={styles.select} value={form.tourId} onChange={handleFormChange}>
              <option value="">-- Choose Tour Package --</option>
              {tours.map(t => (
                <option key={t._id} value={t._id}>{t.tourName} (₹{t.price})</option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Booking Date</label>
              <input type="date" name="bookingDate" required style={styles.input} value={form.bookingDate} onChange={handleFormChange} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Number of People</label>
              <input type="number" name="numberOfPeople" required min="1" style={styles.input} value={form.numberOfPeople} onChange={handleFormChange} />
            </div>
          </div>

          {/* Amount Box */}
          <div style={styles.amountBox}>
            <div style={styles.amountRow}>
              <span>Ticket Price per traveler:</span>
              <strong>₹{selectedTourPrice.toLocaleString('en-IN')}</strong>
            </div>
            <div style={styles.amountRowTotal}>
              <span>Total Amount:</span>
              <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>
            Confirm &amp; Save Booking
          </button>
        </form>
      </Modal>
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
    top: '10%',
    left: '10%',
    width: '350px',
    height: '350px',
    background: 'rgba(99, 102, 241, 0.12)',
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
    background: 'rgba(236, 72, 153, 0.08)',
    borderRadius: '50%',
    filter: 'blur(110px)',
    pointerEvents: 'none'
  },
  container: {
    maxWidth: '1000px',
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
  addBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    background: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
    marginBottom: '20px'
  },
  custName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700'
  },
  tourLabel: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#a5b4fc',
    fontWeight: '600'
  },
  priceSection: {
    textAlign: 'right'
  },
  amount: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '800',
    color: '#10b981'
  },
  qty: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
    display: 'block'
  },
  stepperBox: {
    padding: '10px 0',
    marginBottom: '20px'
  },
  stepperContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '650px',
    margin: '0 auto',
    padding: '0 20px',
    boxSizing: 'border-box'
  },
  stepBubble: (active) => ({
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${active ? '#818cf8' : 'rgba(255, 255, 255, 0.1)'}`,
    color: active ? '#fff' : '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    position: 'relative'
  }),
  stepLabel: (active) => ({
    position: 'absolute',
    top: '34px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '10px',
    fontWeight: '700',
    color: active ? '#a5b4fc' : '#6b7280',
    whiteSpace: 'nowrap'
  }),
  stepLine: (active) => ({
    flexGrow: 1,
    height: '2px',
    backgroundColor: active ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
    margin: '0 8px'
  }),
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  metaBox: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#9ca3af'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  actionBtn: (color) => ({
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: `1px solid ${color}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    outline: 'none',
    ':hover': {
      backgroundColor: color
    }
  }),
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.2)'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    color: '#d1d5db',
    fontWeight: '600'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#111827',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    cursor: 'pointer'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#fff',
    outline: 'none',
    fontSize: '14px'
  },
  amountBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#9ca3af'
  },
  amountRowTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    color: '#fff',
    fontWeight: '700',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '8px',
    marginTop: '4px'
  },
  submitBtn: {
    marginTop: '10px',
    padding: '12px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '15px'
  },
  emptyWrap: {
    textAlign: 'center',
    padding: '40px 0',
    background: 'rgba(17, 24, 39, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px'
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
