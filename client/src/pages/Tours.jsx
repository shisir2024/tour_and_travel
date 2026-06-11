import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function Tours() {
  const { token, userRole } = useAuth();
  const location = useLocation();
  const [tours, setTours] = useState([]);
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedTour, setSelectedTour] = useState(null);

  // Form fields
  const [form, setForm] = useState({
    tourName: '',
    destination: '',
    description: '',
    duration: '',
    price: '',
    startDate: '',
    endDate: '',
    maxCapacity: '',
    imageUrl: ''
  });

  const isStaff = userRole === 'staff';

  const fetchTours = async () => {
    try {
      const endpoint = isStaff ? '/tours' : '/tours/my';
      const res = await apiFetch(endpoint, { token });
      if (res?.data) setTours(res.data);
    } catch (err) {
      toast.error('Failed to load tours.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuides = async () => {
    if (!isStaff) return;
    try {
      const res = await apiFetch('/user/guides', { token });
      if (res?.data) setGuides(res.data);
    } catch (err) {
      toast.error('Failed to load guides.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchTours();
      fetchGuides();
    }
  }, [token, userRole]);

  useEffect(() => {
    // Check query params to open modal directly (e.g. from Dashboard quick action)
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new' && isStaff) {
      handleOpenAdd();
    }
  }, [location.search, isStaff]);

  const handleOpenAdd = () => {
    setModalType('add');
    setSelectedTour(null);
    setForm({
      tourName: '',
      destination: '',
      description: '',
      duration: '',
      price: '',
      startDate: '',
      endDate: '',
      maxCapacity: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tour) => {
    setModalType('edit');
    setSelectedTour(tour);
    setForm({
      tourName: tour.tourName,
      destination: tour.destination,
      description: tour.description || '',
      duration: tour.duration,
      price: tour.price,
      startDate: tour.startDate.split('T')[0],
      endDate: tour.endDate.split('T')[0],
      maxCapacity: tour.maxCapacity,
      imageUrl: tour.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await apiFetch('/tours', {
          method: 'POST',
          body: form,
          token
        });
        toast.success('Tour created successfully!');
      } else {
        await apiFetch(`/tours/${selectedTour._id}`, {
          method: 'PUT',
          body: form,
          token
        });
        toast.success('Tour updated successfully!');
      }
      setIsModalOpen(false);
      fetchTours();
    } catch (err) {
      toast.error(err.message || 'Error saving tour details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    try {
      await apiFetch(`/tours/${id}`, { method: 'DELETE', token });
      toast.success('Tour deleted.');
      fetchTours();
    } catch (err) {
      toast.error(err.message || 'Error deleting tour.');
    }
  };

  const handleAssignGuide = async (tourId, guideId) => {
    try {
      await apiFetch(`/tours/${tourId}/assign-guide`, {
        method: 'PUT',
        body: { guideId: guideId || null },
        token
      });
      toast.success('Guide assignment updated!');
      fetchTours();
    } catch (err) {
      toast.error(err.message || 'Error assigning guide.');
    }
  };

  const handleStatusChange = async (tourId, status) => {
    try {
      await apiFetch(`/tours/${tourId}/status`, {
        method: 'PUT',
        body: { status },
        token
      });
      toast.success('Status updated!');
      fetchTours();
    } catch (err) {
      toast.error(err.message || 'Error updating status.');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(e.target.value), 300);
  };

  const filteredTours = useMemo(() =>
    tours.filter(t =>
      t.tourName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      t.destination?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  , [tours, debouncedSearch]);

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Tour Listings...</p>
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
            <h1 style={styles.title}>🗺️ Tour Packages</h1>
            <p style={styles.subtitle}>{isStaff ? 'Manage travel packages, destinations, and assigned guides.' : 'View and update progress of your assigned tours.'}</p>
          </div>
          {isStaff && (
            <button style={styles.addBtn} onClick={handleOpenAdd}>
              ➕ Create New Tour
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div style={styles.filterBar}>
          <input 
            type="text" 
            style={styles.searchInput}
            placeholder="🔍 Search by name or destination..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Tour Grid */}
        {filteredTours.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyText}>No tours found matching the criteria.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredTours.map(tour => (
              <div key={tour._id} style={styles.card}>
                {tour.imageUrl && (
                  <img
                    src={tour.imageUrl}
                    alt={tour.destination}
                    style={styles.cardImg}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{tour.tourName}</h3>
                  <StatusBadge status={tour.status} />
                </div>
                <p style={styles.cardDesc}>{tour.description || 'No description available for this tour package.'}</p>
                
                <div style={styles.metaGrid}>
                  <div style={styles.metaItem}>📍 <strong>Destination:</strong> {tour.destination}</div>
                  <div style={styles.metaItem}>⏱️ <strong>Duration:</strong> {tour.duration}</div>
                  <div style={styles.metaItem}>🪙 <strong>Price:</strong> ₹{tour.price.toLocaleString('en-IN')}</div>
                  <div style={styles.metaItem}>👥 <strong>Max Capacity:</strong> {tour.maxCapacity} seats</div>
                  <div style={styles.metaItem}>📅 <strong>Start:</strong> {new Date(tour.startDate).toLocaleDateString()}</div>
                  <div style={styles.metaItem}>🏁 <strong>End:</strong> {new Date(tour.endDate).toLocaleDateString()}</div>
                </div>

                <div style={styles.guideBox}>
                  {isStaff ? (
                    <div>
                      <label style={styles.guideLabel}>Assign Tour Guide:</label>
                      <select 
                        style={styles.guideSelect}
                        value={tour.assignedGuide?._id || ''}
                        onChange={(e) => handleAssignGuide(tour._id, e.target.value)}
                      >
                        <option value="">-- No Guide Assigned --</option>
                        {guides.map(g => (
                          <option key={g._id} value={g._id}>{g.name} ({g.phone || 'No phone'})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={styles.guideStatic}>
                      👤 <strong>Guide:</strong> {tour.assignedGuide ? tour.assignedGuide.name : 'Unassigned'}
                    </div>
                  )}
                </div>

                <div style={styles.cardActions}>
                  {isStaff ? (
                    <>
                      <button style={styles.editBtn} onClick={() => handleOpenEdit(tour)}>✏️ Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(tour._id)}>🗑️ Delete</button>
                    </>
                  ) : (
                    tour.status !== 'completed' && (
                      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <button style={styles.statusBtn('#3b82f6')} onClick={() => handleStatusChange(tour._id, 'active')}>⚡ Start</button>
                        <button style={styles.statusBtn('#10b981')} onClick={() => handleStatusChange(tour._id, 'completed')}>✓ Complete</button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'add' ? 'Create Tour Package' : 'Edit Tour Details'}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tour Name</label>
            <input type="text" name="tourName" required style={styles.input} value={form.tourName} onChange={handleFormChange} />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Destination</label>
              <input type="text" name="destination" required style={styles.input} value={form.destination} onChange={handleFormChange} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Duration</label>
              <input type="text" name="duration" required placeholder="e.g. 5 Days / 4 Nights" style={styles.input} value={form.duration} onChange={handleFormChange} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price (₹)</label>
              <input type="number" name="price" required style={styles.input} value={form.price} onChange={handleFormChange} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Max Capacity</label>
              <input type="number" name="maxCapacity" required style={styles.input} value={form.maxCapacity} onChange={handleFormChange} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Start Date</label>
              <input type="date" name="startDate" required style={styles.input} value={form.startDate} onChange={handleFormChange} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>End Date</label>
              <input type="date" name="endDate" required style={styles.input} value={form.endDate} onChange={handleFormChange} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Place Image URL</label>
            <input
              type="url"
              name="imageUrl"
              placeholder="https://images.unsplash.com/..."
              style={styles.input}
              value={form.imageUrl}
              onChange={handleFormChange}
            />
            {form.imageUrl && (
              <div style={styles.imgPreviewWrap}>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  style={styles.imgPreview}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <span style={styles.imgPreviewLabel}>📸 Preview</span>
              </div>
            )}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea name="description" rows="3" style={styles.textarea} value={form.description} onChange={handleFormChange} />
          </div>
          <button type="submit" style={styles.submitBtn}>
            {modalType === 'add' ? 'Save Package' : 'Update Package'}
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
    top: '15%',
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
    maxWidth: '1200px',
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
  filterBar: {
    marginBottom: '30px'
  },
  searchInput: {
    width: '100%',
    maxWidth: '450px',
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    backdropFilter: 'blur(10px)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  card: {
    background: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
  },
  cardImg: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    display: 'block'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
    padding: '20px 24px 0'
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700'
  },
  cardDesc: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0 24px 16px',
    lineHeight: '1.5',
    flexGrow: 1
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '12px',
    color: '#d1d5db',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    margin: '0 24px 16px'
  },
  metaItem: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  guideBox: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '14px 24px',
    marginBottom: '0'
  },
  guideLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600'
  },
  guideSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#111827',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
  },
  guideStatic: {
    fontSize: '13px',
    color: '#a5b4fc'
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    padding: '0 24px 20px'
  },
  imgPreviewWrap: {
    marginTop: '10px',
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  imgPreview: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    display: 'block'
  },
  imgPreviewLabel: {
    position: 'absolute',
    bottom: '8px',
    left: '10px',
    fontSize: '11px',
    color: '#fff',
    background: 'rgba(0,0,0,0.55)',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  editBtn: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#818cf8',
    border: '1px solid rgba(129, 140, 248, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(129, 140, 248, 0.1)'
    }
  },
  deleteBtn: {
    flex: 1,
    padding: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)'
    }
  },
  statusBtn: (color) => ({
    flex: 1,
    padding: '8px',
    backgroundColor: 'transparent',
    color: '#fff',
    border: `1px solid ${color}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: color
    }
  }),
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#fff',
    outline: 'none',
    fontSize: '14px'
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    resize: 'vertical'
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
