import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';
import toast, { Toaster } from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { pathname }  = useLocation();
  const navigate      = useNavigate();
  const { isAuth, userName, userRole, token, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen]  = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest('.hamburger-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const res = await apiFetch('/notifications/my', { token });
        if (res?.data) {
          const unread = res.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        // fail silently for badge indicator
      }
    };

    fetchUnread();

    const socket = getSocket();
    const handleNewNotification = (data) => {
      setUnreadCount(prev => prev + 1);
      toast(`🔔 ${data.title}: ${data.message}`, {
        duration: 4000,
        icon: '🔔',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      });
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [token]);

  const getLinks = () => {
    if (!isAuth) return [];
    if (userRole === 'admin') {
      return [
        { to: '/admin-dashboard', label: '🛡️ Admin' },
        { to: '/tours',           label: '🗺️ Tours' },
        { to: '/customers',       label: '👥 Customers' },
        { to: '/bookings',        label: '📋 Bookings' },
        { to: '/notifications',   label: `🔔 Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
      ];
    }
    if (userRole === 'staff') {
      return [
        { to: '/staff-dashboard', label: '🏠 Dashboard' },
        { to: '/tours',           label: '🗺️ Tours' },
        { to: '/customers',       label: '👥 Customers' },
        { to: '/bookings',        label: '📋 Bookings' },
        { to: '/notifications',   label: `🔔 Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
      ];
    }
    return [
      { to: '/home',        label: '🏠 Home' },
      { to: '/about',       label: '📖 About' },
      { to: '/booking',     label: '✈️ Book Tour' },
      { to: '/milestones',  label: '🏆 Milestones' },
      { to: '/my-bookings', label: '🗓️ My Bookings' },
      { to: '/notifications',label: `🔔 Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    ];
  };

  const links = getLinks();

  const handleLogout = () => { logout(); navigate('/login'); };
  const openWhatsApp = () => {
    const phone = '7398760425';
    const message = 'Hello! I\'m interested in booking a tour.';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to={userRole === 'admin' ? '/admin-dashboard' : userRole === 'staff' ? '/staff-dashboard' : '/home'} className="navbar-logo">MyTripAgency</Link>

          <div className="navbar-actions">
            <button className="theme-btn" onClick={toggle} title="Toggle theme">
              {dark ? '☀️' : '🌙'}
            </button>
            <button className={`hamburger${open ? ' active' : ''}`} onClick={() => setOpen(!open)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
          </div>

          <ul className={`navbar-links${open ? ' open' : ''}`}>
            {links.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`nav-link${pathname === l.to ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >{l.label}</Link>
              </li>
            ))}
            <li className="auth-item">
              {isAuth ? (
                <div className="auth-group">
                  <span className="user-badge">{userName} ({userRole})</span>
                  <div className="hamburger-dropdown-container">
                    <button className={`hamburger-menu-btn ${dropdownOpen ? 'active' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                      <span /><span /><span />
                    </button>
                    {dropdownOpen && (
                      <div className="hamburger-dropdown-menu">
                        {userRole === 'client' && (
                          <>
                            <Link to="/contact" className="dropdown-link" onClick={() => setDropdownOpen(false)}>📬 Contact</Link>
                            <Link to="/faq" className="dropdown-link" onClick={() => setDropdownOpen(false)}>❓ FAQ</Link>
                          </>
                        )}
                        <button className="dropdown-logout-btn" onClick={() => { setDropdownOpen(false); handleLogout(); }}>🚪 Logout</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link to="/login" className="login-btn" onClick={() => setOpen(false)}>Login</Link>
              )}
            </li>
          </ul>
        </div>
      </nav>

      <button className="floating-whatsapp" onClick={openWhatsApp} title="Chat on WhatsApp" aria-label="WhatsApp">
        <div className="whatsapp-bubble">
          <span className="whatsapp-pulse"></span>
          <span className="whatsapp-pulse"></span>
          <svg className="whatsapp-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.105 0-2.177.338-3.087.966l-.221.144-2.289-.601.612 2.26-.146.232c-.697.909-1.066 1.96-1.066 3.09 0 3.872 3.158 7.021 7.046 7.021h.002c1.889 0 3.657-.736 4.988-2.067 1.33-1.33 2.067-3.098 2.067-4.986 0-3.873-3.158-7.032-7.046-7.032m5.926-3.897C15.88 2.549 13.501 1.5 10.88 1.5 5.037 1.5.384 6.137.384 11.969c0 2.1.549 4.146 1.595 5.945L.714 23.5l6.231-1.634c1.738.922 3.693 1.411 5.735 1.411 5.843 0 10.496-4.637 10.496-10.469 0-2.797-1.122-5.429-3.161-7.409Z"/>
          </svg>
        </div>
      </button>
    </>
  );
}
