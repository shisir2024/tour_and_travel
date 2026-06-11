import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast, { Toaster } from 'react-hot-toast';
import { useFadeIn } from '../hooks/useFadeIn';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

export default function BookingForm() {
  const navigate = useNavigate();
  const ref      = useFadeIn();
  const { token, isAuth } = useAuth();
  
  const [tours, setTours] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', tourId: '', travelers: '1' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      try {
        // Fetch tours + profile in PARALLEL instead of sequential
        const [toursRes, profileRes] = await Promise.all([
          apiFetch('/tours', { token }),
          apiFetch('/user/profile', { token }),
        ]);
        if (toursRes?.data)
          setTours(toursRes.data.filter(t => t.status === 'active'));
        if (profileRes?.data) {
          const { name, email, phone } = profileRes.data;
          setForm(prev => ({ ...prev, name: name || '', email: email || '', phone: phone || '' }));
        }
      } catch (err) {
        toast.error('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const selectedTour = tours.find(t => t._id === form.tourId);

  const change = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name)                     e.name        = 'Name is required';
    if (!form.email)                    e.email       = 'Email is required';
    else if (!form.email.includes('@')) e.email       = 'Enter valid email';
    if (!form.phone)                    e.phone       = 'Phone number is required';
    
    if (!form.tourId) {
      e.tourId = 'Please select a tour package';
    } else if (selectedTour) {
      const seats = Number(form.travelers);
      if (isNaN(seats) || seats <= 0) {
        e.travelers = 'Enter a valid number of travelers';
      } else if (selectedTour.availableSeats < seats) {
        e.travelers = `Only ${selectedTour.availableSeats} seats available on this tour`;
      }
    }
    return e;
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      const body = {
        tourId: form.tourId,
        numberOfPeople: Number(form.travelers)
      };

      const res = await apiFetch('/bookings/client', {
        method: 'POST',
        body,
        token
      });

      toast.success('🎉 Tour Booking Successful! Directing to payment...');
      setForm(prev => ({ ...prev, tourId: '', travelers: '1' }));
      
      const newBookingId = res.data?._id;
      setTimeout(() => navigate('/my-bookings', { state: { highlightBookingId: newBookingId } }), 1800);
    } catch (err) {
      toast.error(err.message || 'Booking failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.card}>
            <div style={{ height: 28, width: '60%', margin: '0 auto 20px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {[1,2,3,4].map(i => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ height: 13, width: '30%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 8 }} />
                <div style={{ height: 42, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
            <div style={{ height: 46, borderRadius: 8, background: 'rgba(79,70,229,0.3)', marginTop: 16 }} />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={styles.page} className="dark-section">
        <div ref={ref} className="fade-in dark-card" style={styles.card}>
          <h2 style={styles.title}>🗺️ Tour Booking Form</h2>
          <p style={{ textAlign:'center', color:'#888', fontSize:'14px', marginBottom:'20px' }}>Select an active tour package and complete your booking!</p>
          <form onSubmit={submit}>
            <div style={styles.group}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} className="dark-input" type="text" name="name" value={form.name} disabled />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Email Address</label>
              <input style={styles.input} className="dark-input" type="email" name="email" value={form.email} disabled />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Phone Number</label>
              <input style={styles.input} className="dark-input" type="text" name="phone" value={form.phone} onChange={change} />
              {errors.phone && <span style={styles.error}>{errors.phone}</span>}
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Select Tour Package</label>
              <select style={styles.input} className="dark-input" name="tourId" value={form.tourId} onChange={change}>
                <option value="">-- Select Package --</option>
                {tours.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.tourName} to {t.destination} ({t.duration}) - ₹{t.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              {errors.tourId && <span style={styles.error}>{errors.tourId}</span>}
            </div>

            {selectedTour && (
              <div style={styles.tourDetailBox}>
                <p>📍 <strong>Destination:</strong> {selectedTour.destination}</p>
                <p>⏱️ <strong>Duration:</strong> {selectedTour.duration}</p>
                <p>💳 <strong>Price per Person:</strong> ₹{selectedTour.price.toLocaleString('en-IN')}</p>
                <p style={{ color: selectedTour.availableSeats < 5 ? '#f87171' : '#34d399' }}>
                  🔥 <strong>Available Seats:</strong> {selectedTour.availableSeats} slots left
                </p>
              </div>
            )}

            <div style={styles.group}>
              <label style={styles.label}>Number of Travelers</label>
              <input 
                style={styles.input} 
                className="dark-input" 
                type="number" 
                name="travelers" 
                min="1"
                max={selectedTour ? selectedTour.availableSeats : undefined}
                value={form.travelers} 
                onChange={change} 
              />
              {errors.travelers && <span style={styles.error}>{errors.travelers}</span>}
            </div>

            {selectedTour && (
              <div style={styles.totalBox}>
                <span>Total Cost:</span>
                <strong style={styles.totalVal}>
                  ₹{(selectedTour.price * Number(form.travelers || 1)).toLocaleString('en-IN')}
                </strong>
              </div>
            )}

            <button style={styles.btn} type="submit" disabled={tours.length === 0}>
              {tours.length === 0 ? 'No Active Tours Available' : 'Request Booking 🚀'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

const styles = {
  page:  { display: 'flex', justifyContent: 'center', padding: '60px 20px', background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)', minHeight: '100vh' },
  card:  { background: 'rgba(17, 24, 39, 0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', width: '100%', maxWidth: '460px', height: 'fit-content' },
  title: { textAlign: 'center', color: '#818cf8', marginBottom: '6px', fontSize: '24px', fontWeight: 'bold' },
  group: { marginBottom: '16px' },
  label: { fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '6px', color: '#d1d5db' },
  input: { width: '100%', padding: '11px 14px', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'rgba(255, 255, 255, 0.02)', color: '#fff', outline: 'none' },
  error: { color: '#f87171', fontSize: '12px', marginTop: '3px', display: 'block' },
  btn:   { width: '100%', padding: '13px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', marginTop: '16px' },
  tourDetailBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#d1d5db',
    marginBottom: '16px',
    lineHeight: '1.6'
  },
  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    marginTop: '12px',
    color: '#9ca3af'
  },
  totalVal: {
    fontSize: '20px',
    color: '#10b981',
    fontWeight: '800'
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
