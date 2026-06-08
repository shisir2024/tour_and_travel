import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function Customers() {
  const { token } = useAuth();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedCust, setSelectedCust] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchCustomers = async () => {
    try {
      const res = await apiFetch('/customers', { token });
      if (res?.data) setCustomers(res.data);
    } catch (err) {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleOpenAdd();
    }
  }, [location.search]);

  const handleOpenAdd = () => {
    setModalType('add');
    setSelectedCust(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setModalType('edit');
    setSelectedCust(cust);
    setForm({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      address: cust.address || ''
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error('Name, email, and phone are required fields.');
      return;
    }
    try {
      if (modalType === 'add') {
        await apiFetch('/customers', {
          method: 'POST',
          body: form,
          token
        });
        toast.success('Customer added successfully!');
      } else {
        await apiFetch(`/customers/${selectedCust._id}`, {
          method: 'PUT',
          body: form,
          token
        });
        toast.success('Customer details updated!');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Error processing request.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE', token });
      toast.success('Customer deleted successfully.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Error deleting customer.');
    }
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading Customer Directory...</p>
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
            <h1 style={styles.title}>👥 Customer Directory</h1>
            <p style={styles.subtitle}>View, search, and manage registered agency clients.</p>
          </div>
          <button style={styles.addBtn} onClick={handleOpenAdd}>
            ➕ Add Customer
          </button>
        </div>

        {/* Search */}
        <div style={styles.filterBar}>
          <input 
            type="text" 
            style={styles.searchInput}
            placeholder="🔍 Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Client Table / Grid */}
        {filtered.length === 0 ? (
          <div style={styles.emptyWrap}>
            <p style={styles.emptyText}>No customers registered in database yet.</p>
          </div>
        ) : (
          <div style={styles.tablePanel}>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email Address</th>
                    <th style={styles.th}>Phone Number</th>
                    <th style={styles.th}>Location / Address</th>
                    <th style={styles.th}>Created By</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cust => (
                    <tr key={cust._id} style={styles.tr}>
                      <td style={styles.td}><strong>{cust.name}</strong></td>
                      <td style={styles.td}>{cust.email}</td>
                      <td style={styles.td}>{cust.phone}</td>
                      <td style={styles.td}>{cust.address || '—'}</td>
                      <td style={styles.td}>{cust.createdBy?.name || 'Staff'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={styles.actionsCell}>
                          <button style={styles.actionBtnEdit} onClick={() => handleOpenEdit(cust)}>✏️ Edit</button>
                          <button style={styles.actionBtnDelete} onClick={() => handleDelete(cust._id)}>🗑️ Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'add' ? 'Register New Customer' : 'Modify Customer Profile'}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input type="text" name="name" required style={styles.input} value={form.name} onChange={handleFormChange} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input type="email" name="email" required style={styles.input} value={form.email} onChange={handleFormChange} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input type="tel" name="phone" required style={styles.input} value={form.phone} onChange={handleFormChange} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Physical Address</label>
            <textarea name="address" rows="3" style={styles.textarea} value={form.address} onChange={handleFormChange} />
          </div>
          <button type="submit" style={styles.submitBtn}>
            {modalType === 'add' ? 'Save Customer Record' : 'Save Changes'}
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
    top: '20%',
    left: '15%',
    width: '300px',
    height: '300px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '50%',
    filter: 'blur(90px)',
    pointerEvents: 'none'
  },
  glow2: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    width: '350px',
    height: '350px',
    background: 'rgba(236, 72, 153, 0.06)',
    borderRadius: '50%',
    filter: 'blur(100px)',
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
  tablePanel: {
    background: 'rgba(17, 24, 39, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  thRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  th: {
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: '600',
    padding: '16px',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.01)'
    }
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#d1d5db'
  },
  actionsCell: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  actionBtnEdit: {
    padding: '6px 12px',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    color: '#818cf8',
    border: '1px solid rgba(129, 140, 248, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  actionBtnDelete: {
    padding: '6px 12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
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
