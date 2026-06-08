import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import toast, { Toaster } from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = n => Number(n || 0).toLocaleString('en-IN');
const fmtR = n => `₹${fmt(n)}`;
const fmtD = d => new Date(d).toLocaleString();
const fmtPct = n => `${n >= 0 ? '+' : ''}${n}%`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MiniBar({ value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = '#6366f1' }) {
  return (
    <div style={{ ...S.card, boxShadow: `inset 0 0 20px ${color}18` }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#e5e7eb', borderLeft: '3px solid #6366f1', paddingLeft: 10 }}>{children}</h3>;
}

function Panel({ children, style }) {
  return <div style={{ ...S.panel, ...style }}>{children}</div>;
}

// ─── Mini Revenue Chart ───────────────────────────────────────────────────────
function RevenueChart({ data }) {
  if (!data?.length) return <p style={S.empty}>No trend data available.</p>;
  const maxRev = Math.max(...data.map(d => d.revenue));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = maxRev > 0 ? Math.max((d.revenue / maxRev) * 100, 4) : 4;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${MONTHS[(d._id.month||1)-1]} ${d._id.year}: ${fmtR(d.revenue)}`}>
            <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)', borderRadius: '4px 4px 0 0', minHeight: 6 }} />
            <span style={{ fontSize: 9, color: '#6b7280' }}>{MONTHS[(d._id.month||1)-1]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { token, userName } = useAuth();
  const navigate = useNavigate();

  const TABS = [
    { id: 'overview',     icon: '📊', label: 'Overview' },
    { id: 'users',        icon: '👤', label: 'Users' },
    { id: 'staff',        icon: '👷', label: 'Staff' },
    { id: 'finance',      icon: '💰', label: 'Finance' },
    { id: 'tours',        icon: '🗺️', label: 'Tours' },
    { id: 'reports',      icon: '📄', label: 'Reports' },
    { id: 'notifications',icon: '🔔', label: 'Notifications' },
    { id: 'content',      icon: '📝', label: 'Content' },
    { id: 'system',       icon: '🖥️', label: 'System' },
    { id: 'audit',        icon: '📋', label: 'Audit Logs' },
    { id: 'security',     icon: '🛡️', label: 'Security' },
    { id: 'settings',     icon: '⚙️', label: 'Settings' },
  ];

  const [tab, setTab]             = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [overview, setOverview]   = useState(null);
  const [users, setUsers]         = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage]   = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [staffPerf, setStaffPerf] = useState([]);
  const [finance, setFinance]     = useState(null);
  const [tours, setTours]         = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [sysStatus, setSysStatus] = useState(null);
  const [failedLogins, setFailedLogins] = useState([]);
  const [settings, setSettings]   = useState({});
  const [settingsForm, setSettingsForm] = useState({});
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target: 'all' });
  const [newStaff, setNewStaff]   = useState({ name:'', email:'', password:'', phone:'', department:'', responsibilities:'' });
  const [resetPwdMap, setResetPwdMap] = useState({});

  // ── Data loaders ────────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await apiFetch('/admin/overview', { token });
      setOverview(r.data);
    } catch { toast.error('Failed to load overview.'); }
    finally { setLoading(false); }
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: userPage, limit: 15 });
      if (userSearch)     params.append('search', userSearch);
      if (userRoleFilter) params.append('role',   userRoleFilter);
      const r = await apiFetch(`/admin/users?${params}`, { token });
      setUsers(r.data); setUserTotal(r.total);
    } catch { toast.error('Failed to load users.'); }
  }, [token, userPage, userSearch, userRoleFilter]);

  const loadStaff    = async () => { try { const r = await apiFetch('/admin/staff/performance', { token }); setStaffPerf(r.data); } catch { toast.error('Failed to load staff.'); } };
  const loadFinance  = async () => { try { const r = await apiFetch('/admin/finance', { token }); setFinance(r.data); } catch { toast.error('Failed to load finance.'); } };
  const loadTours    = async () => { try { const r = await apiFetch('/tours', { token }); setTours(r.data); } catch { toast.error('Failed to load tours.'); } };
  const loadAudit    = async () => { try { const r = await apiFetch(`/admin/audit-logs?page=${auditPage}&limit=20`, { token }); setAuditLogs(r.data); setAuditTotal(r.total); } catch { toast.error('Failed to load audit logs.'); } };
  const loadSystem   = async () => { try { const r = await apiFetch('/admin/system-status', { token }); setSysStatus(r.data); } catch { toast.error('Failed to load system status.'); } };
  const loadSecurity = async () => { try { const r = await apiFetch('/admin/security/failed-logins', { token }); setFailedLogins(r.data); } catch { toast.error('Failed to load security data.'); } };
  const loadSettings = async () => { try { const r = await apiFetch('/admin/settings', { token }); setSettings(r.data); setSettingsForm(r.data); } catch { toast.error('Failed to load settings.'); } };

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    if (tab === 'users')         loadUsers();
    if (tab === 'staff')         loadStaff();
    if (tab === 'finance')       loadFinance();
    if (tab === 'tours')         loadTours();
    if (tab === 'audit')         loadAudit();
    if (tab === 'system')        loadSystem();
    if (tab === 'security')      loadSecurity();
    if (tab === 'settings' || tab === 'content') loadSettings();
  }, [tab, userPage, auditPage]);

  // ── User actions ─────────────────────────────────────────────────────────────
  const changeRole = async (id, role) => {
    try { await apiFetch(`/admin/users/${id}/role`, { token, method: 'PUT', body: { role } }); toast.success('Role updated.'); loadUsers(); } catch (e) { toast.error(e.message); }
  };
  const toggleActive = async (id) => {
    try { const r = await apiFetch(`/admin/users/${id}/toggle-active`, { token, method: 'PUT' }); toast.success(r.message); loadUsers(); } catch (e) { toast.error(e.message); }
  };
  const blockUser = async (id) => {
    try { const r = await apiFetch(`/admin/users/${id}/block`, { token, method: 'PUT' }); toast.success(r.message); loadUsers(); } catch (e) { toast.error(e.message); }
  };
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try { await apiFetch(`/admin/users/${id}`, { token, method: 'DELETE' }); toast.success('User deleted.'); loadUsers(); } catch (e) { toast.error(e.message); }
  };
  const resetPassword = async (id) => {
    const pwd = resetPwdMap[id];
    if (!pwd || pwd.length < 6) return toast.error('Enter at least 6 characters.');
    try { await apiFetch(`/admin/users/${id}/reset-password`, { token, method: 'PUT', body: { newPassword: pwd } }); toast.success('Password reset.'); setResetPwdMap(p => ({ ...p, [id]: '' })); } catch (e) { toast.error(e.message); }
  };

  // ── Staff create ─────────────────────────────────────────────────────────────
  const createStaff = async () => {
    try { await apiFetch('/admin/staff', { token, method: 'POST', body: newStaff }); toast.success('Staff created.'); setNewStaff({ name:'', email:'', password:'', phone:'', department:'', responsibilities:'' }); loadStaff(); } catch (e) { toast.error(e.message); }
  };

  // ── Broadcast ────────────────────────────────────────────────────────────────
  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return toast.error('Title and message required.');
    try { const r = await apiFetch('/admin/notify', { token, method: 'POST', body: broadcastForm }); toast.success(r.message); setBroadcastForm({ title: '', message: '', target: 'all' }); } catch (e) { toast.error(e.message); }
  };

  // ── Settings save ─────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    try { await apiFetch('/admin/settings', { token, method: 'PUT', body: settingsForm }); toast.success('Settings saved.'); } catch (e) { toast.error(e.message); }
  };

  // ── CSV Export ────────────────────────────────────────────────────────────────
  const exportReport = async (type) => {
    try {
      const r = await apiFetch(`/admin/reports/${type}`, { token });
      if (!r.data?.length) return toast.error('No data to export.');
      const keys = Object.keys(r.data[0]).filter(k => typeof r.data[0][k] !== 'object');
      const csv  = [keys.join(','), ...r.data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
      const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURI(csv)}`; a.download = `${type}_report_${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success(`${type} report exported!`);
    } catch (e) { toast.error(e.message); }
  };

  const clearFailedLoginsAll = async () => {
    try { await apiFetch('/admin/security/failed-logins', { token, method: 'DELETE' }); toast.success('Records cleared.'); loadSecurity(); } catch (e) { toast.error(e.message); }
  };

  if (loading && !overview) return (
    <div style={S.loadWrap}><div style={S.spinner} /><p style={{ color: '#9ca3af', marginTop: 16 }}>Loading Admin Panel...</p></div>
  );

  const ov = overview;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <div style={S.page}>
        <div style={S.glow1} /><div style={S.glow2} />
        <div style={S.container}>

          {/* Header */}
          <div style={S.header}>
            <div>
              <h1 style={S.title}>👑 Admin Control Panel</h1>
              <p style={S.subtitle}>Welcome, {userName} — Full system access</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={S.badge('#f59e0b','rgba(245,158,11,0.15)')}>👑 Super Admin</div>
              <div style={S.badge('#10b981','rgba(16,185,129,0.1)')}>● System Online</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={S.tabBar}>
            {TABS.map(t => (
              <button key={t.id} style={S.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
          {tab === 'overview' && ov && (
            <div>
              {/* KPI Grid */}
              <div style={S.grid4}>
                <StatCard icon="💰" label="Total Revenue"   value={fmtR(ov.revenue.total)}   sub={`Monthly: ${fmtR(ov.revenue.monthly)}`} color="#10b981" />
                <StatCard icon="📈" label="Revenue Growth"  value={fmtPct(ov.revenue.growthPct)} sub="vs last month"  color="#6366f1" />
                <StatCard icon="👥" label="Total Users"     value={fmt(ov.users.total)}       sub={`Staff: ${ov.users.staff} | Clients: ${ov.users.clients}`} color="#ec4899" />
                <StatCard icon="📋" label="Total Bookings"  value={fmt(ov.bookings.total)}    sub={`Pending: ${ov.bookings.pending}`} color="#f59e0b" />
                <StatCard icon="🗺️" label="Active Tours"    value={fmt(ov.tours.active)}      sub={`Total: ${ov.tours.total}`} color="#3b82f6" />
                <StatCard icon="✅" label="Confirmed"       value={fmt(ov.bookings.confirmed)} sub="bookings"  color="#10b981" />
                <StatCard icon="❌" label="Cancelled"       value={fmt(ov.bookings.cancelled)} sub="bookings"  color="#ef4444" />
                <StatCard icon="📧" label="Subscribers"     value={fmt(ov.misc.totalSubscribers)} sub={`Contacts: ${ov.misc.totalContacts}`} color="#8b5cf6" />
              </div>

              <div style={S.splitGrid}>
                {/* Revenue Trend */}
                <Panel>
                  <SectionTitle>📈 6-Month Revenue Trend</SectionTitle>
                  <RevenueChart data={ov.trendData} />
                </Panel>

                {/* Recent Bookings */}
                <Panel>
                  <div style={S.panelHead}>
                    <SectionTitle>📢 Recent Bookings</SectionTitle>
                    <button style={S.linkBtn} onClick={() => navigate('/bookings')}>View All</button>
                  </div>
                  {ov.recentBookings.map(b => (
                    <div key={b._id} style={S.listRow}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{b.customerId?.name || b.userId?.name || 'Client'}</div>
                        <div style={S.meta}>✈️ {b.tourId?.tourName || 'Tour'} • {b.tourId?.destination}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>{fmtR(b.totalAmount)}</div>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>

              {/* Recent Activity */}
              <Panel style={{ marginTop: 20 }}>
                <SectionTitle>🕐 Recent System Activity</SectionTitle>
                {ov.recentActivity.length === 0 ? <p style={S.empty}>No activity yet.</p> :
                  <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                      <thead><tr style={S.thr}><th style={S.th}>Action</th><th style={S.th}>By</th><th style={S.th}>Details</th><th style={S.th}>Time</th></tr></thead>
                      <tbody>
                        {ov.recentActivity.map(a => (
                          <tr key={a._id} style={S.tr}>
                            <td style={S.td}><span style={{ ...S.chip, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{a.action}</span></td>
                            <td style={S.td}>{a.performedBy?.name || 'System'}</td>
                            <td style={S.td}>{a.details}</td>
                            <td style={S.td}>{fmtD(a.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </Panel>
            </div>
          )}

          {/* ── Tab: Users ────────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <Panel>
              <SectionTitle>👤 User Management Center</SectionTitle>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input style={S.input} placeholder="🔍 Search name or email..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} onKeyDown={e => e.key === 'Enter' && loadUsers()} />
                <select style={S.select} value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}>
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="client">Client</option>
                </select>
                <button style={S.btn('#6366f1')} onClick={loadUsers}>Search</button>
              </div>
              <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>Showing {users.length} of {userTotal} users</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thr}>
                    <th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Role</th>
                    <th style={S.th}>Status</th><th style={S.th}>Last Login</th><th style={S.th}>New Password</th><th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={S.tr}>
                        <td style={S.td}>{u.name}</td>
                        <td style={S.td}>{u.email}</td>
                        <td style={S.td}>
                          <select value={u.role} onChange={e => changeRole(u._id, e.target.value)} style={S.roleSelect(u.role)}>
                            <option value="client">client</option>
                            <option value="staff">staff</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td style={S.td}>
                          <span style={{ color: u.isBlocked ? '#ef4444' : u.isActive ? '#10b981' : '#f59e0b', fontWeight: 700, fontSize: 12 }}>
                            {u.isBlocked ? '🚫 Blocked' : u.isActive ? '✅ Active' : '⏸ Inactive'}
                          </span>
                        </td>
                        <td style={S.td}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}</td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <input style={{ ...S.input, width: 110, padding: '4px 8px', fontSize: 11 }} type="password" placeholder="New pwd..." value={resetPwdMap[u._id] || ''} onChange={e => setResetPwdMap(p => ({ ...p, [u._id]: e.target.value }))} />
                            <button style={{ ...S.btn('#8b5cf6'), padding: '4px 8px', fontSize: 11 }} onClick={() => resetPassword(u._id)}>Reset</button>
                          </div>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button style={S.btn(u.isActive ? '#f59e0b' : '#10b981')} onClick={() => toggleActive(u._id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                            <button style={S.btn(u.isBlocked ? '#10b981' : '#ef4444')} onClick={() => blockUser(u._id)}>{u.isBlocked ? 'Unblock' : 'Block'}</button>
                            <button style={S.btn('#dc2626')} onClick={() => deleteUser(u._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                {userPage > 1 && <button style={S.btn('#6366f1')} onClick={() => setUserPage(p => p - 1)}>← Prev</button>}
                <span style={{ color: '#9ca3af', fontSize: 13, alignSelf: 'center' }}>Page {userPage}</span>
                {users.length === 15 && <button style={S.btn('#6366f1')} onClick={() => setUserPage(p => p + 1)}>Next →</button>}
              </div>
            </Panel>
          )}

          {/* ── Tab: Staff ────────────────────────────────────────────────────── */}
          {tab === 'staff' && (
            <div>
              {/* Create Staff */}
              <Panel>
                <SectionTitle>➕ Create Staff Account</SectionTitle>
                <div style={S.grid3}>
                  {[['name','Full Name'],['email','Email'],['password','Password'],['phone','Phone'],['department','Department'],['responsibilities','Responsibilities']].map(([k, lbl]) => (
                    <input key={k} style={S.input} placeholder={lbl} type={k === 'password' ? 'password' : 'text'} value={newStaff[k]} onChange={e => setNewStaff(p => ({ ...p, [k]: e.target.value }))} />
                  ))}
                </div>
                <button style={{ ...S.btn('#10b981'), marginTop: 16, padding: '10px 24px' }} onClick={createStaff}>Create Staff Account</button>
              </Panel>

              {/* Staff Performance Table */}
              <Panel style={{ marginTop: 20 }}>
                <SectionTitle>🏆 Staff Performance Ranking</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr style={S.thr}>
                      <th style={S.th}>Rank</th><th style={S.th}>Name</th><th style={S.th}>Email</th>
                      <th style={S.th}>Department</th><th style={S.th}>Bookings Handled</th>
                      <th style={S.th}>Customers Managed</th><th style={S.th}>Tours Assigned</th>
                      <th style={S.th}>Last Login</th><th style={S.th}>Status</th>
                    </tr></thead>
                    <tbody>
                      {staffPerf.map((s, i) => {
                        const maxB = staffPerf[0]?.bookingsHandled || 1;
                        return (
                          <tr key={s._id} style={S.tr}>
                            <td style={S.td}><span style={{ ...S.chip, background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#fcd34d' : '#9ca3af' }}>#{i + 1}</span></td>
                            <td style={S.td}><strong>{s.name}</strong></td>
                            <td style={S.td}>{s.email}</td>
                            <td style={S.td}>{s.department || '—'}</td>
                            <td style={S.td}>
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.bookingsHandled}</div>
                              <MiniBar value={s.bookingsHandled} max={maxB} color="#6366f1" />
                            </td>
                            <td style={S.td}>{s.customersManaged}</td>
                            <td style={S.td}>{s.toursAssigned}</td>
                            <td style={S.td}>{s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : '—'}</td>
                            <td style={S.td}><span style={{ color: s.isActive ? '#10b981' : '#ef4444', fontSize: 12 }}>{s.isActive ? '✅ Active' : '🔴 Inactive'}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          )}

          {/* ── Tab: Finance ──────────────────────────────────────────────────── */}
          {tab === 'finance' && finance && (
            <div>
              <div style={S.grid4}>
                <StatCard icon="💰" label="Total Revenue"    value={fmtR(finance.total.totalRevenue)}  color="#10b981" />
                <StatCard icon="📅" label="Yearly Revenue"   value={fmtR(finance.yearly.revenue)} sub={`${finance.yearly.count} paid bookings`} color="#6366f1" />
                <StatCard icon="↩️" label="Total Refunds"    value={fmtR(finance.refunds.totalRefunded)} sub={`${finance.refunds.count} refunds`} color="#ef4444" />
                <StatCard icon="⏳" label="Pending Payments" value={fmtR(finance.pending.totalPending)} sub={`${finance.pending.count} pending`} color="#f59e0b" />
                <StatCard icon="✅" label="Payment Success Rate" value={`${finance.successRate}%`} color="#10b981" />
                <StatCard icon="📋" label="Total Transactions" value={fmt(finance.total.totalCount)} color="#3b82f6" />
              </div>

              <div style={S.splitGrid}>
                {/* Revenue by Destination */}
                <Panel>
                  <SectionTitle>📍 Revenue by Destination</SectionTitle>
                  {finance.byDestination.map((d, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{d._id}</span><span style={{ color: '#10b981', fontWeight: 700 }}>{fmtR(d.revenue)}</span>
                      </div>
                      <MiniBar value={d.revenue} max={finance.byDestination[0]?.revenue || 1} color="#10b981" />
                    </div>
                  ))}
                </Panel>

                {/* Revenue by Tour */}
                <Panel>
                  <SectionTitle>✈️ Revenue by Tour</SectionTitle>
                  {finance.byTour.map((t, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span>{t._id.tourName}</span><span style={{ color: '#6366f1', fontWeight: 700 }}>{fmtR(t.revenue)}</span>
                      </div>
                      <MiniBar value={t.revenue} max={finance.byTour[0]?.revenue || 1} color="#6366f1" />
                    </div>
                  ))}
                </Panel>
              </div>

              {/* Revenue by Guide */}
              <Panel style={{ marginTop: 20 }}>
                <SectionTitle>👤 Revenue by Guide</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr style={S.thr}><th style={S.th}>Guide</th><th style={S.th}>Bookings</th><th style={S.th}>Revenue</th><th style={S.th}>Bar</th></tr></thead>
                    <tbody>
                      {finance.byGuide.map((g, i) => (
                        <tr key={i} style={S.tr}>
                          <td style={S.td}>{g._id.guideName}</td>
                          <td style={S.td}>{g.bookings}</td>
                          <td style={S.td} style={{ color: '#10b981', fontWeight: 700 }}>{fmtR(g.revenue)}</td>
                          <td style={{ ...S.td, width: '35%' }}><MiniBar value={g.revenue} max={finance.byGuide[0]?.revenue || 1} color="#ec4899" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* Monthly Trend */}
              <Panel style={{ marginTop: 20 }}>
                <SectionTitle>📈 Monthly Revenue Trend</SectionTitle>
                <RevenueChart data={finance.monthlyTrend} />
              </Panel>
            </div>
          )}

          {/* ── Tab: Tours ────────────────────────────────────────────────────── */}
          {tab === 'tours' && (
            <Panel>
              <div style={S.panelHead}>
                <SectionTitle>🗺️ Tours Overview</SectionTitle>
                <button style={S.btn('#6366f1')} onClick={() => navigate('/tours?action=new')}>➕ Add Tour</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thr}>
                    <th style={S.th}>Tour</th><th style={S.th}>Destination</th><th style={S.th}>Price</th>
                    <th style={S.th}>Seats</th><th style={S.th}>Guide</th><th style={S.th}>Status</th><th style={S.th}>Dates</th>
                  </tr></thead>
                  <tbody>
                    {tours.map(t => (
                      <tr key={t._id} style={S.tr}>
                        <td style={S.td}><strong>{t.tourName}</strong></td>
                        <td style={S.td}>{t.destination}</td>
                        <td style={S.td} style={{ color: '#10b981', fontWeight: 700 }}>{fmtR(t.price)}</td>
                        <td style={S.td}>{t.availableSeats} / {t.maxCapacity}</td>
                        <td style={S.td}>{t.assignedGuide?.name || <span style={{ color: '#ef4444' }}>Unassigned</span>}</td>
                        <td style={S.td}><StatusBadge status={t.status} /></td>
                        <td style={S.td}>{new Date(t.startDate).toLocaleDateString()} → {new Date(t.endDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* ── Tab: Reports ──────────────────────────────────────────────────── */}
          {tab === 'reports' && (
            <Panel>
              <SectionTitle>📄 Reports & Export</SectionTitle>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Export data as CSV for all major entities.</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { type: 'bookings', icon: '📋', color: '#6366f1', label: 'Booking Report' },
                  { type: 'revenue',  icon: '💰', color: '#10b981', label: 'Revenue Report' },
                  { type: 'customers',icon: '👥', color: '#ec4899', label: 'Customer Report' },
                  { type: 'tours',    icon: '🗺️', color: '#f59e0b', label: 'Tours Report' },
                  { type: 'staff',    icon: '👷', color: '#3b82f6', label: 'Staff Performance Report' },
                ].map(r => (
                  <div key={r.type} style={{ ...S.card, flex: '1 1 200px', cursor: 'pointer', border: `1px solid ${r.color}33` }} onClick={() => exportReport(r.type)}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Click to export CSV</div>
                    <button style={{ ...S.btn(r.color), marginTop: 14, width: '100%' }}>📥 Export CSV</button>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* ── Tab: Notifications ────────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <Panel>
              <SectionTitle>🔔 Broadcast Notification</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
                <input style={S.input} placeholder="Notification Title" value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))} />
                <textarea style={{ ...S.input, height: 100, resize: 'vertical' }} placeholder="Notification Message..." value={broadcastForm.message} onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))} />
                <select style={S.select} value={broadcastForm.target} onChange={e => setBroadcastForm(p => ({ ...p, target: e.target.value }))}>
                  <option value="all">📣 Send to All Users</option>
                  <option value="staff">👷 Send to All Staff</option>
                  <option value="client">👤 Send to All Clients</option>
                </select>
                <button style={{ ...S.btn('#6366f1'), padding: '12px 24px', fontSize: 15 }} onClick={sendBroadcast}>📢 Send Notification</button>
              </div>
            </Panel>
          )}

          {/* ── Tab: Content ──────────────────────────────────────────────────── */}
          {tab === 'content' && (
            <Panel>
              <SectionTitle>📝 Content Management</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { key: 'announcement', label: '📢 Announcement Banner', type: 'text' },
                  { key: 'faqContent',   label: '❓ FAQ Content (HTML/Text)', type: 'textarea' },
                  { key: 'aboutContent', label: '📖 About Page Content',    type: 'textarea' },
                  { key: 'privacyPolicy',label: '🔐 Privacy Policy',        type: 'textarea' },
                  { key: 'termsConditions',label: '📜 Terms & Conditions',  type: 'textarea' },
                  { key: 'homeBanner',   label: '🖼️ Home Banner Text',      type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 13, color: '#d1d5db', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea style={{ ...S.input, height: 100, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} value={settingsForm[f.key] || ''} onChange={e => setSettingsForm(p => ({ ...p, [f.key]: e.target.value }))} />
                      : <input style={{ ...S.input, width: '100%', boxSizing: 'border-box' }} value={settingsForm[f.key] || ''} onChange={e => setSettingsForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    }
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={settingsForm.announcementActive || false} onChange={e => setSettingsForm(p => ({ ...p, announcementActive: e.target.checked }))} />
                  <label style={{ color: '#d1d5db', fontSize: 13 }}>Show announcement banner to all users</label>
                </div>
                <button style={{ ...S.btn('#10b981'), padding: '12px 24px' }} onClick={saveSettings}>💾 Save All Content</button>
              </div>
            </Panel>
          )}

          {/* ── Tab: System ───────────────────────────────────────────────────── */}
          {tab === 'system' && sysStatus && (
            <div>
              <div style={S.grid4}>
                <StatCard icon="⏱️" label="Server Uptime"   value={`${Math.floor(sysStatus.uptime/3600)}h ${Math.floor((sysStatus.uptime%3600)/60)}m`} color="#10b981" />
                <StatCard icon="🧠" label="Memory Used"     value={`${sysStatus.memory.used} MB`} sub={`Heap: ${sysStatus.memory.heap}/${sysStatus.memory.total} MB`} color="#6366f1" />
                <StatCard icon="🔌" label="Active Sockets"  value={sysStatus.sockets.active} color="#ec4899" />
                <StatCard icon="🖥️" label="Node Version"   value={sysStatus.nodeVersion} sub={sysStatus.platform} color="#f59e0b" />
              </div>

              <div style={S.splitGrid}>
                <Panel>
                  <SectionTitle>🗄️ Database Collections</SectionTitle>
                  {Object.entries(sysStatus.database.collections).map(([k, v]) => (
                    <div key={k} style={S.listRow}>
                      <span style={{ textTransform: 'capitalize' }}>{k}</span>
                      <span style={{ color: '#6366f1', fontWeight: 700 }}>{fmt(v)} docs</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12 }}><span style={{ ...S.chip, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>● {sysStatus.database.status}</span></div>
                </Panel>

                <Panel>
                  <SectionTitle>❌ Recent Error Logs</SectionTitle>
                  {sysStatus.recentErrors.length === 0 ? <p style={S.empty}>No errors recorded. System healthy ✅</p> :
                    sysStatus.recentErrors.map(e => (
                      <div key={e._id} style={{ ...S.listRow, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>{e.action}</span>
                        <span style={S.meta}>{e.details} • {fmtD(e.createdAt)}</span>
                      </div>
                    ))
                  }
                </Panel>
              </div>
            </div>
          )}

          {/* ── Tab: Audit Logs ───────────────────────────────────────────────── */}
          {tab === 'audit' && (
            <Panel>
              <SectionTitle>📋 Audit Logs</SectionTitle>
              <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 14 }}>{auditTotal} total records</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thr}>
                    <th style={S.th}>Action</th><th style={S.th}>Category</th><th style={S.th}>Performed By</th>
                    <th style={S.th}>Details</th><th style={S.th}>IP</th><th style={S.th}>Time</th><th style={S.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {auditLogs.map(a => (
                      <tr key={a._id} style={S.tr}>
                        <td style={S.td}><span style={{ ...S.chip, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', fontSize: 10 }}>{a.action}</span></td>
                        <td style={S.td}><span style={{ ...S.chip, background: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: 10 }}>{a.category}</span></td>
                        <td style={S.td}>{a.performedBy?.name || 'System'}<br /><span style={{ fontSize: 10, color: '#6b7280' }}>{a.performedBy?.email}</span></td>
                        <td style={S.td}>{a.details || '—'}</td>
                        <td style={S.td}>{a.ipAddress}</td>
                        <td style={S.td}>{fmtD(a.createdAt)}</td>
                        <td style={S.td}><span style={{ color: a.status === 'success' ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>{a.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                {auditPage > 1 && <button style={S.btn('#6366f1')} onClick={() => setAuditPage(p => p - 1)}>← Prev</button>}
                <span style={{ color: '#9ca3af', fontSize: 13, alignSelf: 'center' }}>Page {auditPage}</span>
                {auditLogs.length === 20 && <button style={S.btn('#6366f1')} onClick={() => setAuditPage(p => p + 1)}>Next →</button>}
              </div>
            </Panel>
          )}

          {/* ── Tab: Security ─────────────────────────────────────────────────── */}
          {tab === 'security' && (
            <Panel>
              <div style={S.panelHead}>
                <SectionTitle>🛡️ Security Center — Failed Login Attempts</SectionTitle>
                <button style={S.btn('#ef4444')} onClick={clearFailedLoginsAll}>🗑️ Clear All</button>
              </div>
              <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 14 }}>{failedLogins.length} records</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead><tr style={S.thr}>
                    <th style={S.th}>Email</th><th style={S.th}>IP Address</th><th style={S.th}>Reason</th><th style={S.th}>Time</th>
                  </tr></thead>
                  <tbody>
                    {failedLogins.map(f => (
                      <tr key={f._id} style={S.tr}>
                        <td style={S.td}>{f.email}</td>
                        <td style={S.td}>{f.ipAddress}</td>
                        <td style={S.td}>{f.reason}</td>
                        <td style={S.td}>{fmtD(f.createdAt)}</td>
                      </tr>
                    ))}
                    {failedLogins.length === 0 && <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#6b7280', padding: 24 }}>No failed login attempts recorded.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {/* ── Tab: Settings ─────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <Panel>
              <SectionTitle>⚙️ Agency Settings</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                {[
                  { key: 'agencyName',     label: '🏢 Agency Name' },
                  { key: 'contactEmail',   label: '📧 Contact Email' },
                  { key: 'contactPhone',   label: '📞 Contact Phone' },
                  { key: 'whatsappNumber', label: '💬 WhatsApp Number' },
                  { key: 'address',        label: '📍 Address' },
                  { key: 'currency',       label: '💱 Currency Code (e.g. INR)' },
                  { key: 'currencySymbol', label: '🪙 Currency Symbol (e.g. ₹)' },
                  { key: 'taxPercentage',  label: '🧾 Tax %' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
                    <input style={{ ...S.input, width: '100%', boxSizing: 'border-box' }} value={settingsForm[f.key] || ''} onChange={e => setSettingsForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 5, fontWeight: 600 }}>📋 Booking Policy</label>
                  <textarea style={{ ...S.input, height: 80, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} value={settingsForm.bookingPolicy || ''} onChange={e => setSettingsForm(p => ({ ...p, bookingPolicy: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 5, fontWeight: 600 }}>🚫 Cancellation Policy</label>
                  <textarea style={{ ...S.input, height: 80, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} value={settingsForm.cancellationPolicy || ''} onChange={e => setSettingsForm(p => ({ ...p, cancellationPolicy: e.target.value }))} />
                </div>
              </div>
              <button style={{ ...S.btn('#10b981'), marginTop: 20, padding: '12px 32px', fontSize: 15 }} onClick={saveSettings}>💾 Save Settings</button>
            </Panel>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:      { position: 'relative', minHeight: '100vh', background: 'radial-gradient(circle at 40% 20%, #0f172a 0%, #030712 100%)', color: '#fff', padding: '40px 20px 80px', boxSizing: 'border-box', overflowX: 'hidden' },
  glow1:     { position: 'absolute', top: '5%',  left: '5%',  width: 500, height: 500, background: 'rgba(99,102,241,0.07)',  borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 1 },
  glow2:     { position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'rgba(236,72,153,0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 1 },
  container: { maxWidth: 1400, margin: '0 auto', zIndex: 2, position: 'relative' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, backdropFilter: 'blur(10px)', flexWrap: 'wrap', gap: 12 },
  title:     { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' },
  subtitle:  { margin: '4px 0 0', color: '#6b7280', fontSize: 13 },
  badge:     (color, bg) => ({ padding: '6px 14px', backgroundColor: bg, border: `1px solid ${color}44`, color, borderRadius: 8, fontWeight: 700, fontSize: 12 }),
  tabBar:    { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 14 },
  tabBtn:    a => ({ padding: '8px 16px', background: a ? '#4f46e5' : 'rgba(255,255,255,0.04)', color: '#fff', border: `1px solid ${a ? '#818cf8' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.2s' }),
  grid4:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 20 },
  grid3:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 },
  card:      { background: 'rgba(17,24,39,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 },
  panel:     { background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 },
  splitGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 20 },
  panelHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  listRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 8 },
  meta:      { fontSize: 11, color: '#6b7280', marginTop: 2 },
  empty:     { color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  table:     { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 },
  thr:       { borderBottom: '1px solid rgba(255,255,255,0.08)' },
  th:        { fontSize: 11, color: '#6b7280', fontWeight: 700, paddingBottom: 10, paddingRight: 14, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  tr:        { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:        { padding: '11px 14px 11px 0', color: '#d1d5db', verticalAlign: 'middle' },
  chip:      { padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 },
  input:     { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '10px 14px', outline: 'none' },
  select:    { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, padding: '10px 14px', cursor: 'pointer' },
  roleSelect:role => ({ background: role==='admin' ? 'rgba(245,158,11,0.15)' : role==='staff' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }),
  btn:       c => ({ padding: '7px 14px', background: 'transparent', border: `1px solid ${c}`, color: c, borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', transition: 'all 0.2s' }),
  linkBtn:   { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  loadWrap:  { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#030712' },
  spinner:   { width: 40, height: 40, border: '4px solid rgba(129,140,248,0.1)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};
