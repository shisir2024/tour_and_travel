import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageTitle } from '../hooks/usePageTitle';
import { useFadeIn } from '../hooks/useFadeIn';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';
import toast, { Toaster } from 'react-hot-toast';

/* ── Offer slider data ── */
const offers = [
  { bg: 'linear-gradient(135deg,#ff6b35,#f7c59f)', emoji: '🔥', tag: 'LIMITED TIME', title: '50% OFF on Goa Beach Packages!', sub: 'Book before 31st July — only 12 slots left', btn: 'Grab Deal', color: '#fff' },
  { bg: 'linear-gradient(135deg,#1a3a5c,#0d6efd)', emoji: '✈️', tag: 'HOT DEAL',     title: '80% OFF on Europe Tour Packages!', sub: 'Hurry up — exclusive discount ending soon', btn: 'Book Now', color: '#ffc107' },
  { bg: 'linear-gradient(135deg,#1b4332,#40916c)', emoji: '🌿', tag: 'FLASH SALE',   title: 'Kerala Backwaters — Flat ₹999 Only!', sub: 'All-inclusive 3-day package at unbeatable price', btn: 'See Package', color: '#fff' },
  { bg: 'linear-gradient(135deg,#6a0572,#c77dff)', emoji: '🎉', tag: 'WEEKEND SPECIAL', title: 'Manali Snow Trip — 60% Discount!', sub: 'Family packages with hotel + travel included', btn: 'Explore', color: '#fff' },
];

const tagColors = { Beach:'#0d6efd', Nature:'#198754', Snow:'#6610f2', Heritage:'#fd7e14', Luxury:'#dc3545', Adventure:'#20c997', Romance:'#e91e8c', Cultural:'#6f42c1', Romantic:'#e91e8c', Trekking:'#0dcaf0' };

export default function Home() {
  usePageTitle('Home');
  const navigate = useNavigate();
  const { isAuth, token, userName, userRole } = useAuth();

  const [slideIdx, setSlideIdx]   = useState(0);
  const [animKey,  setAnimKey]    = useState(0);
  const [filter,   setFilter]     = useState('All');
  const [country,  setCountry]    = useState('All');
  const [loading,  setLoading]    = useState(true);
  
  // Dashboard & Dynamic Data State
  const [tours, setTours] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'dashboard'

  const offerRef    = useFadeIn();
  const packRef     = useFadeIn();
  const whyRef      = useFadeIn();
  const statsRef    = useFadeIn();

  /* Auto-advance offer slider every 4s */
  useEffect(() => {
    const t = setInterval(() => {
      setSlideIdx(i => (i + 1) % offers.length);
      setAnimKey(k => k + 1);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const toursRes = await apiFetch('/tours', { token });
      if (toursRes?.data) setTours(toursRes.data);

      if (isAuth && userRole === 'client') {
        const bookingsRes = await apiFetch('/bookings/client/mine', { token });
        if (bookingsRes?.data) setBookings(bookingsRes.data);

        const notifRes = await apiFetch('/notifications/my', { token });
        if (notifRes?.data) setNotifications(notifRes.data.slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading home data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAuth, userRole]);

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [loadData]);

  // Socket.IO listeners — targeted state updates, no full reload
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();

    const handleToursUpdated = ({ action, tour, tourId }) => {
      if (action === 'created') {
        setTours(prev => [tour, ...prev]);
        toast.success(`🗺️ New Tour Created: ${tour.tourName}!`);
      } else if (action === 'updated') {
        setTours(prev => prev.map(t => t._id === tour._id ? tour : t));
        toast.info(`ℹ️ Tour Updated: ${tour.tourName}`);
      } else if (action === 'deleted') {
        setTours(prev => prev.filter(t => t._id !== tourId));
        toast.error('❌ A tour package has been cancelled/deleted.');
      }
    };

    const handleBookingStatusUpdated = (updatedBooking) => {
      if (updatedBooking?._id) {
        setBookings(prev => prev.map(b => b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b));
      }
    };

    const handleNewNotification = (data) => {
      if (data?._id) {
        setNotifications(prev => [data, ...prev].slice(0, 3));
      }
    };

    socket.on('tours-updated', handleToursUpdated);
    socket.on('booking-status-updated', handleBookingStatusUpdated);
    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('tours-updated', handleToursUpdated);
      socket.off('booking-status-updated', handleBookingStatusUpdated);
      socket.off('new-notification', handleNewNotification);
    };
  }, [token]);

  const activeTours = useMemo(() => tours.filter(t => t.status === 'active'), [tours]);

  const getCategory = (t) => {
    const n = t.tourName.toLowerCase(), d = t.destination.toLowerCase();
    if (n.includes('beach') || d.includes('goa')) return 'Beach';
    if (n.includes('hill') || n.includes('snow') || d.includes('manali')) return 'Snow';
    if (n.includes('forest') || n.includes('jungle') || d.includes('kerala')) return 'Nature';
    if (n.includes('luxury') || d.includes('maldives')) return 'Luxury';
    return 'Adventure';
  };

  const categories = useMemo(() =>
    ['All', ...new Set(activeTours.map(getCategory))]
  , [activeTours]);

  const destinations = useMemo(() =>
    ['All', ...new Set(activeTours.map(t => t.destination))]
  , [activeTours]);

  const filteredTours = useMemo(() =>
    activeTours.filter(t => {
      const cat = getCategory(t);
      return (filter === 'All' || cat === filter) &&
             (country === 'All' || t.destination === country);
    })
  , [activeTours, filter, country]);

  const upcomingTrips = useMemo(() =>
    bookings.filter(b => b.status === 'confirmed' || b.status === 'in-progress' || (b.status === 'pending' && b.paymentStatus !== 'paid'))
  , [bookings]);

  const bookingHistory = useMemo(() =>
    bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
  , [bookings]);

  const recommendedTours = useMemo(() => {
    if (bookings.length === 0) return activeTours.slice(0, 3);
    const bookedDestinations = bookings.map(b => b.tourId?.destination).filter(Boolean);
    const recommended = activeTours.filter(t => bookedDestinations.includes(t.destination) && !bookings.some(b => b.tourId?._id === t._id));
    return recommended.length > 0 ? recommended.slice(0, 3) : activeTours.slice(0, 3);
  }, [activeTours, bookings]);
  const slide = offers[slideIdx];

  const handleMarkNotificationRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT', token });
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Alert dismissed');
    } catch (err) {
      // fail silently
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />

      {/* Hero */}
      <section style={st.hero}>
        <div style={st.heroOverlay} />
        <div style={st.heroContent}>
          <p style={st.heroWelcome}>🌏 Welcome to MyTripAgency</p>
          <h1 style={st.heroTitle} className="hero-title">Discover the World's<br />Most Beautiful Places</h1>
          <p style={st.heroSub} className="hero-sub">Plan unforgettable trips with expert guides, best prices & zero hassle</p>
          
          {isAuth && userRole === 'client' && (
            <div style={st.tabSwitchBox}>
              <button 
                style={{ ...st.tabSwitchBtn, backgroundColor: activeTab === 'explore' ? '#4f46e5' : 'rgba(255,255,255,0.08)' }}
                onClick={() => setActiveTab('explore')}
              >
                🗺️ Explore Packages
              </button>
              <button 
                style={{ ...st.tabSwitchBtn, backgroundColor: activeTab === 'dashboard' ? '#4f46e5' : 'rgba(255,255,255,0.08)' }}
                onClick={() => setActiveTab('dashboard')}
              >
                ✨ My Travel Hub {upcomingTrips.length > 0 && <span style={st.badgeNum}>{upcomingTrips.length}</span>}
              </button>
            </div>
          )}

          {!isAuth && (
            <div style={st.heroBtns}>
              <Link to="/signup" style={st.heroBtnPrimary}>Sign Up Now 🚀</Link>
              <Link to="/login" style={st.heroBtnOutline}>Sign In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Toggle View: Dashboard vs Explore */}
      {activeTab === 'dashboard' && isAuth && userRole === 'client' ? (
        /* Personalized Client Dashboard */
        <section className="fade-in dark-section" style={st.dashSection}>
          <div style={st.container}>
            <div style={st.dashGrid}>
              
              {/* Left Column: Upcoming Trips & Timeline */}
              <div style={st.dashLeft}>
                <div style={st.glassPanel}>
                  <h3 style={st.panelTitle}>✈️ Upcoming & Active Trips</h3>
                  {upcomingTrips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <p style={{ fontSize: '32px', margin: 0 }}>🧳</p>
                      <p style={{ color: '#9ca3af', fontSize: '14px', margin: '8px 0 16px' }}>No upcoming trips scheduled.</p>
                      <button style={st.bookBtn} onClick={() => setActiveTab('explore')}>Explore Packages</button>
                    </div>
                  ) : (
                    <div style={st.upcomingList}>
                      {upcomingTrips.map(bk => (
                        <div key={bk._id} style={st.tripItem}>
                          <div style={st.tripHeader}>
                            <h4 style={st.tripTitle}>📍 {bk.tourId?.destination || 'Custom Destination'}</h4>
                            <span style={st.tripStatusBadge(bk.status)}>{bk.status}</span>
                          </div>
                          <p style={st.tripSub}>{bk.tourId?.tourName} • {bk.numberOfPeople} traveler(s)</p>
                          
                          <div style={st.stepperWrapper}>
                            <p style={st.stepTitle}>Status Progress:</p>
                            {/* Stepper */}
                            <div style={st.stepper}>
                              {['pending', 'confirmed', 'in-progress', 'completed'].map((step, idx, arr) => {
                                const currentStatus = bk.status.toLowerCase();
                                const activeIdx = arr.indexOf(currentStatus);
                                const isDone = idx <= activeIdx;
                                return (
                                  <div key={step} style={{ display: 'flex', alignItems: 'center', flexGrow: idx < arr.length - 1 ? 1 : 0 }}>
                                    <div style={st.stepNode(isDone)} title={step}>
                                      {idx + 1}
                                    </div>
                                    {idx < arr.length - 1 && <div style={st.stepConnector(idx < activeIdx)} />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div style={st.tripFooter}>
                            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                              Date: {bk.tourId ? new Date(bk.tourId.startDate).toLocaleDateString() : 'N/A'}
                            </div>
                            <Link to="/my-bookings" style={st.viewDetailsBtn}>View &amp; Pay 💳</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Booking History */}
                <div style={{ ...st.glassPanel, marginTop: '24px' }}>
                  <h3 style={st.panelTitle}>📜 Booking History</h3>
                  {bookingHistory.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>No completed or cancelled trips in your history.</p>
                  ) : (
                    <div style={st.historyList}>
                      {bookingHistory.map(bk => (
                        <div key={bk._id} style={st.historyItem}>
                          <div>
                            <span style={st.historyDest}>📍 {bk.tourId?.destination || 'Trip'}</span>
                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '10px' }}>
                              {bk.tourId ? new Date(bk.tourId.startDate).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <span style={st.historyStatusBadge(bk.status)}>{bk.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Alerts & Recommendations */}
              <div style={st.dashRight}>
                
                {/* Recent Alerts */}
                <div style={st.glassPanel}>
                  <h3 style={st.panelTitle}>🔔 Latest Notifications</h3>
                  {notifications.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No new notifications.</p>
                  ) : (
                    <div style={st.notifList}>
                      {notifications.map(notif => (
                        <div key={notif._id} style={st.notifItem}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={st.notifHeader}>{notif.title}</strong>
                            <button style={st.dismissBtn} onClick={() => handleMarkNotificationRead(notif._id)}>✕</button>
                          </div>
                          <p style={st.notifText}>{notif.message}</p>
                          <span style={st.notifTime}>{new Date(notif.createdAt).toLocaleLowerCase().split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to="/notifications" style={st.allAlertsLink}>View All Notifications →</Link>
                </div>

                {/* Personalized Recommendations */}
                <div style={{ ...st.glassPanel, marginTop: '24px' }}>
                  <h3 style={st.panelTitle}>✨ Recommendations for You</h3>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '-10px', marginBottom: '16px' }}>Based on your travel interests & matching active packages</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recommendedTours.map(tour => (
                      <div key={tour._id} style={st.recCard}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>📍 {tour.destination}</h4>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{tour.tourName} ({tour.duration})</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>₹{tour.price.toLocaleString('en-IN')}</div>
                          <Link to="/booking" style={st.recBookBtn}>Book</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      ) : (
        /* Explore Tour Packages (Default / Public Home Section) */
        <>
          {/* Offer Slider */}
          <section ref={offerRef} className="fade-in" style={st.offerSection}>
            <div style={{ ...st.offerSlide, background: slide.bg }} key={animKey} className="offer-slide">
              <div style={st.offerInner}>
                <div>
                  <span style={st.offerTag}>{slide.tag}</span>
                  <h2 style={{ ...st.offerTitle, color: slide.color }}>{slide.emoji} {slide.title}</h2>
                  <p style={st.offerSub}>{slide.sub}</p>
                  <Link to="/booking" style={st.offerBtn}>{slide.btn} →</Link>
                </div>
                <div style={st.offerDots}>
                  {offers.map((_, i) => (
                    <button key={i} style={{ ...st.dot, ...(i === slideIdx ? st.dotActive : {}) }}
                      onClick={() => { setSlideIdx(i); setAnimKey(k => k+1); }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Dynamic Tour Packages */}
          <section ref={packRef} className="fade-in dark-section" style={st.packSection}>
            <div style={st.container}>
              <div style={{ textAlign:'center', marginBottom:'36px' }}>
                <p style={st.sectionTag}>✈️ BEST DEALS</p>
                <h2 style={st.sectionTitle}>Tour Packages by Country & Place</h2>
                <p style={st.sectionSub}>Handpicked destinations with exclusive discounts — book before they're gone!</p>
              </div>

              {/* Filters */}
              <div style={st.filterRow}>
                <div style={st.filterGroup}>
                  <span style={st.filterLabel}>Destination:</span>
                  {destinations.map(c => (
                    <button key={c} style={{ ...st.filterBtn, ...(country===c ? st.filterBtnActive : {}) }}
                      onClick={() => setCountry(c)}>{c}</button>
                  ))}
                </div>
                <div style={st.filterGroup}>
                  <span style={st.filterLabel}>Category:</span>
                  {categories.map(t => (
                    <button key={t} style={{ ...st.filterBtn, ...(filter===t ? st.filterBtnActive : {}) }}
                      onClick={() => setFilter(t)}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div style={st.packGrid}>
                {loading
                  ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                  : filteredTours.map(p => {
                      // derive dummy image and tag
                      let tag = 'Adventure';
                      let img = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70&auto=format';
                      if (p.tourName.toLowerCase().includes('beach') || p.destination.toLowerCase().includes('goa')) {
                        tag = 'Beach';
                        img = 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?w=800&q=70&auto=format';
                      } else if (p.tourName.toLowerCase().includes('hill') || p.tourName.toLowerCase().includes('snow') || p.destination.toLowerCase().includes('manali')) {
                        tag = 'Snow';
                        img = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=70&auto=format';
                      } else if (p.tourName.toLowerCase().includes('forest') || p.tourName.toLowerCase().includes('jungle') || p.destination.toLowerCase().includes('kerala')) {
                        tag = 'Nature';
                        img = 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=70&auto=format';
                      } else if (p.tourName.toLowerCase().includes('luxury') || p.destination.toLowerCase().includes('maldives')) {
                        tag = 'Luxury';
                        img = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70&auto=format';
                      }

                      return (
                        <div key={p._id} style={st.card} className="dark-card tour-card">
                          <div style={{ position:'relative' }}>
                            <img src={img} alt={p.destination} style={st.cardImg} loading="lazy" />
                            <span style={{ ...st.cardTag, background: tagColors[tag] || '#555' }}>{tag}</span>
                            <span style={st.discBadge}>🏷️ 15% OFF</span>
                          </div>
                          <div style={st.cardBody}>
                            <div style={st.cardMeta}>
                              <span style={st.cardCountry}>🌍 {p.destination}</span>
                              <span style={st.cardDays}>📅 {p.duration}</span>
                            </div>
                            <h3 style={st.cardTitle}>📍 {p.tourName}</h3>
                            <div style={st.cardRating}>⭐⭐⭐⭐⭐ <span style={{ fontSize:'12px', color:'#888' }}>({p.availableSeats} seats left)</span></div>
                            <div style={st.cardPriceRow}>
                              <span style={st.cardOld}>₹{(p.price * 1.15).toFixed(0)}</span>
                              <span style={st.cardPrice}>₹{p.price.toLocaleString('en-IN')}</span>
                              <span style={st.cardPp}>per person</span>
                            </div>
                            <Link to="/booking" style={st.cardBtn}>Book Now →</Link>
                          </div>
                        </div>
                      );
                    })
                }
              </div>
              {!loading && filteredTours.length === 0 && (
                <p style={{ textAlign:'center', color:'#888', padding:'40px' }}>No active package deals found.</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* Why Us */}
      <section ref={whyRef} className="fade-in" style={st.whySection}>
        <div style={st.container}>
          <p style={st.sectionTag}>💡 WHY CHOOSE US</p>
          <h2 style={{ ...st.sectionTitle, color:'#fff' }}>We Make Travel Easy & Memorable</h2>
          <div style={st.whyGrid}>
            {[
              ['🏆','Best Price Guarantee','We match any lower price you find anywhere online.'],
              ['🛡️','Safe & Secure','All trips are fully insured with 24/7 emergency support.'],
              ['🎯','Expert Guides','Our local staff members know every hidden gem.'],
              ['⚡','Instant Booking','Book your dream trip in under 2 minutes with instant confirmation.'],
            ].map(([icon,title,desc]) => (
              <div key={title} style={st.whyCard} className="dark-card tour-card">
                <span style={st.whyIcon}>{icon}</span>
                <h3 style={st.whyTitle}>{title}</h3>
                <p style={st.whyDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="fade-in dark-section" style={st.statsSection}>
        <div style={{ ...st.container, display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'40px', padding:'50px 24px' }}>
          {[['320+','Tours Completed'],['48+','Countries'],['5000+','Happy Travelers'],['4.9⭐','Avg Rating'],['12+','Years Experience']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={st.statNum}>{n}</div>
              <div style={st.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

function SkeletonCard() {
  return (
    <div style={{ ...st.card, overflow:'hidden' }}>
      <div className="skeleton" style={{ height:'200px', borderRadius:0 }} />
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
        <div className="skeleton" style={{ height:'14px', width:'60%' }} />
        <div className="skeleton" style={{ height:'18px', width:'80%' }} />
        <div className="skeleton" style={{ height:'14px', width:'50%' }} />
        <div className="skeleton" style={{ height:'36px' }} />
      </div>
    </div>
  );
}

const st = {
  /* hero */
  hero:           { position:'relative', minHeight:'500px', background:'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=70&auto=format) center/cover no-repeat', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', color:'#fff' },
  heroOverlay:    { position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(3, 7, 18, 0.8), rgba(17, 24, 39, 0.6))' },
  heroContent:    { position:'relative', zIndex:1, maxWidth:'800px', padding:'40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroWelcome:    { fontSize:'14px', letterSpacing:'3px', color:'#fbbf24', fontWeight:'bold', marginBottom:'14px' },
  heroTitle:      { fontSize:'clamp(28px,5vw,52px)', fontWeight:'900', lineHeight:1.2, marginBottom:'16px', color: '#fff' },
  heroSub:        { fontSize:'clamp(14px,2vw,18px)', opacity:0.85, marginBottom:'28px', lineHeight:1.6, color: '#d1d5db' },
  heroBtns:       { display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'10px' },
  heroBtnPrimary: { background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', padding:'13px 30px', borderRadius:'50px', fontWeight:'bold', textDecoration:'none', fontSize:'15px', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)' },
  heroBtnOutline: { background:'transparent', color:'#fff', padding:'13px 30px', borderRadius:'50px', fontWeight:'bold', textDecoration:'none', fontSize:'15px', border:'2px solid rgba(255,255,255,0.4)' },
  
  tabSwitchBox:   { display: 'flex', gap: '12px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '50px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' },
  tabSwitchBtn:   { padding: '10px 20px', border: 'none', borderRadius: '50px', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' },
  badgeNum:       { background: '#ef4444', color: '#fff', fontSize: '10px', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  /* Dashboard hub */
  dashSection:    { padding: '50px 0', background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)' },
  dashGrid:       { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', flexWrap: 'wrap', '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } },
  dashLeft:       { display: 'flex', flexDirection: 'column' },
  dashRight:      { display: 'flex', flexDirection: 'column' },
  glassPanel:     { background: 'rgba(17, 24, 39, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(16px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  panelTitle:     { margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' },
  bookBtn:        { padding: '10px 20px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  upcomingList:   { display: 'flex', flexDirection: 'column', gap: '16px' },
  tripItem:       { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' },
  tripHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  tripTitle:      { margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' },
  tripSub:        { margin: 0, fontSize: '13px', color: '#9ca3af' },
  tripStatusBadge: (status) => ({
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#fff',
    backgroundColor: statusColor[status] || '#ffc107',
    padding: '3px 8px',
    borderRadius: '12px'
  }),
  stepperWrapper: { marginTop: '16px', marginBottom: '16px' },
  stepTitle:      { fontSize: '11px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  stepper:        { display: 'flex', alignItems: 'center', width: '100%' },
  stepNode: (done) => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: done ? '#4f46e5' : 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${done ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
    color: done ? '#fff' : '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: 'bold'
  }),
  stepConnector: (done) => ({
    flexGrow: 1,
    height: '2px',
    backgroundColor: done ? '#4f46e5' : 'rgba(255,255,255,0.08)',
    margin: '0 4px'
  }),
  tripFooter:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' },
  viewDetailsBtn: { color: '#818cf8', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' },
  
  historyList:    { display: 'flex', flexDirection: 'column', gap: '10px' },
  historyItem:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' },
  historyDest:    { fontSize: '14px', color: '#d1d5db', fontWeight: '600' },
  historyStatusBadge: (status) => ({
    fontSize: '9px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: status === 'completed' ? '#34d399' : '#f87171',
    backgroundColor: status === 'completed' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
    border: `1px solid ${status === 'completed' ? '#34d399' : '#f87171'}`,
    padding: '2px 8px',
    borderRadius: '10px'
  }),

  /* Alerts */
  notifList:      { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' },
  notifItem:      { padding: '12px', background: 'rgba(129, 140, 248, 0.03)', borderLeft: '3px solid #818cf8', borderTop: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' },
  notifHeader:    { fontSize: '13px', color: '#fff' },
  dismissBtn:     { background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' },
  notifText:      { margin: '4px 0', fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' },
  notifTime:      { fontSize: '10px', color: '#4b5563' },
  allAlertsLink:  { display: 'block', textAlign: 'center', color: '#818cf8', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', marginTop: '10px' },

  /* Recommendations */
  recCard:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' },
  recBookBtn:     { padding: '4px 12px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)', borderRadius: '6px', color: '#a5b4fc', fontSize: '12px', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold', marginTop: '4px' },

  /* offer */
  offerSection:   { padding:'0' },
  offerSlide:     { minHeight:'160px', display:'flex', alignItems:'center', padding:'30px 20px' },
  offerInner:     { maxWidth:'1100px', margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' },
  offerTag:       { fontSize:'11px', letterSpacing:'3px', fontWeight:'bold', background:'rgba(255,255,255,0.25)', padding:'4px 12px', borderRadius:'20px', color:'#fff', marginBottom:'10px', display:'inline-block' },
  offerTitle:     { fontSize:'clamp(18px,3vw,28px)', fontWeight:'900', marginBottom:'6px' },
  offerSub:       { fontSize:'14px', color:'rgba(255,255,255,0.8)', marginBottom:'14px' },
  offerBtn:       { background:'#fff', color:'#000', fontWeight:'bold', padding:'10px 24px', borderRadius:'50px', textDecoration:'none', fontSize:'14px', display:'inline-block' },
  offerDots:      { display:'flex', gap:'8px', alignItems:'center' },
  dot:            { width:'10px', height:'10px', borderRadius:'50%', background:'rgba(255,255,255,0.4)', border:'none', cursor:'pointer' },
  dotActive:      { background:'#fff', width:'28px', borderRadius:'5px' },
  
  /* packages */
  packSection:    { padding:'20px 0 60px', background:'#030712' },
  container:      { maxWidth:'1200px', margin:'0 auto', padding:'0 20px' },
  sectionTag:     { fontSize:'11px', letterSpacing:'3px', fontWeight:'bold', color:'#818cf8', marginBottom:'8px' },
  sectionTitle:   { fontSize:'clamp(22px,4vw,34px)', fontWeight:'bold', color:'#fff', marginBottom:'10px' },
  sectionSub:     { fontSize:'15px', color:'#9ca3af', marginBottom:'0' },
  filterRow:      { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' },
  filterGroup:    { display:'flex', flexWrap:'wrap', alignItems:'center', gap:'8px' },
  filterLabel:    { fontSize:'13px', fontWeight:'bold', color:'#9ca3af', marginRight:'4px' },
  filterBtn:      { padding:'6px 14px', borderRadius:'20px', border:'1.5px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.02)', color: '#d1d5db', fontSize:'13px', cursor:'pointer', fontWeight:'500' },
  filterBtnActive:{ background:'#4f46e5', color:'#fff', borderColor:'#818cf8' },
  packGrid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'24px' },
  card:           { borderRadius:'14px', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', background:'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' },
  cardImg:        { width:'100%', height:'200px', objectFit:'cover', display:'block' },
  cardTag:        { position:'absolute', top:'12px', left:'12px', color:'#fff', fontSize:'11px', fontWeight:'bold', padding:'4px 10px', borderRadius:'20px' },
  discBadge:      { position:'absolute', top:'12px', right:'12px', background:'#ef4444', color:'#fff', fontSize:'11px', fontWeight:'bold', padding:'4px 10px', borderRadius:'20px' },
  cardBody:       { padding:'16px' },
  cardMeta:       { display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#9ca3af', marginBottom:'6px' },
  cardCountry:    {},
  cardDays:       {},
  cardTitle:      { fontSize:'17px', fontWeight:'bold', color:'#fff', marginBottom:'6px' },
  cardRating:     { fontSize:'13px', marginBottom:'10px' },
  cardPriceRow:   { display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'14px' },
  cardOld:        { fontSize:'13px', color:'#4b5563', textDecoration:'line-through' },
  cardPrice:      { fontSize:'22px', fontWeight:'bold', color:'#10b981' },
  cardPp:         { fontSize:'12px', color:'#9ca3af' },
  cardBtn:        { display:'block', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', textAlign:'center', padding:'11px', borderRadius:'8px', fontWeight:'bold', textDecoration:'none', fontSize:'14px' },
  
  /* why */
  whySection:     { background:'linear-gradient(135deg,#030712,#111827)', padding:'60px 20px' },
  whyGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'24px', marginTop:'36px' },
  whyCard:        { background:'rgba(255,255,255,0.03)', borderRadius:'14px', padding:'28px 22px', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)' },
  whyIcon:        { fontSize:'36px', display:'block', marginBottom:'12px' },
  whyTitle:       { fontSize:'16px', fontWeight:'bold', color:'#fff', marginBottom:'8px' },
  whyDesc:        { fontSize:'13px', color:'#9ca3af', lineHeight:1.7 },
  
  /* stats */
  statsSection:   { background:'rgba(17, 24, 39, 0.4)' },
  statNum:        { fontSize:'clamp(26px,4vw,40px)', fontWeight:'900', color:'#818cf8' },
  statLabel:      { fontSize:'13px', color:'#9ca3af', marginTop:'4px' },
};
