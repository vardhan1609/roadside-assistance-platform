import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Wrench, FileText, Ban, CheckCircle, RotateCcw, MapPin, Clock } from 'lucide-react';

const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;

function UserTable({ users, onBlock, onUnblock, role }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            {role === 'mechanic' && <><th>Specialization</th><th>License</th></>}
            <th>Joined</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  {u.name}
                </div>
              </td>
              <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{u.email}</td>
              <td style={{ fontSize: 12 }}>{u.phone}</td>
              {role === 'mechanic' && (
                <>
                  <td><span className="chip">{u.specialization || 'N/A'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.licenseNumber || 'N/A'}</td>
                </>
              )}
              <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <span className={`badge ${u.isBlocked ? 'badge-blocked' : 'badge-active'}`}>
                  {u.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </td>
              <td>
                {u.isBlocked ? (
                  <button className="btn btn-sm btn-success" onClick={() => onUnblock(u._id, u.name)}>
                    <CheckCircle size={12} /> Unblock
                  </button>
                ) : (
                  <button className="btn btn-sm btn-danger" onClick={() => onBlock(u._id, u.name)}>
                    <Ban size={12} /> Block
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [clients, setClients] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState('all');

  const path = window.location.pathname;
  const isClients = path.includes('clients');
  const isMechanics = path.includes('mechanics');
  const isRequests = path.includes('requests');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, clientRes, mechRes, reqRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/users?role=client'),
        axios.get('/admin/users?role=mechanic'),
        axios.get('/admin/requests'),
      ]);
      setStats(statsRes.data);
      setClients(clientRes.data.users);
      setMechanics(mechRes.data.users);
      setRequests(reqRes.data.requests);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBlock = async (id, name) => {
    if (!confirm(`Block ${name}?`)) return;
    try {
      await axios.patch(`/admin/users/${id}/block`);
      toast.success(`${name} has been blocked`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block');
    }
  };

  const handleUnblock = async (id, name) => {
    try {
      await axios.patch(`/admin/users/${id}/unblock`);
      toast.success(`${name} has been unblocked`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock');
    }
  };

  const filteredRequests = reqFilter === 'all' ? requests : requests.filter(r => r.status === reqFilter);

  if (isClients) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage <span>Clients</span></h1>
            <p className="page-subtitle">{clients.length} registered clients</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}><RotateCcw size={14} /> Refresh</button>
        </div>
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
          ) : clients.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No clients registered</div></div>
          ) : (
            <UserTable users={clients} onBlock={handleBlock} onUnblock={handleUnblock} role="client" />
          )}
        </div>
      </div>
    );
  }

  if (isMechanics) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage <span>Mechanics</span></h1>
            <p className="page-subtitle">{mechanics.length} registered mechanics</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}><RotateCcw size={14} /> Refresh</button>
        </div>
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
          ) : mechanics.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔧</div><div className="empty-title">No mechanics registered</div></div>
          ) : (
            <UserTable users={mechanics} onBlock={handleBlock} onUnblock={handleUnblock} role="mechanic" />
          )}
        </div>
      </div>
    );
  }

  if (isRequests) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">All <span>Requests</span></h1>
            <p className="page-subtitle">{requests.length} total requests (view only)</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAll}><RotateCcw size={14} /> Refresh</button>
        </div>

        <div className="filter-bar">
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'].map(s => (
            <button key={s} className={`filter-btn${reqFilter === s ? ' active' : ''}`} onClick={() => setReqFilter(s)}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No requests found</div></div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Client</th>
                    <th>Mechanic</th>
                    <th>Service</th>
                    <th>Location</th>
                    <th>Cost</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req._id}>
                      <td style={{ fontWeight: 600 }}>{req.title}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{req.client?.name}</div>
                          <div style={{ color: 'var(--text-dim)' }}>{req.client?.phone}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {req.mechanic?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><span className="chip">{req.serviceType?.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <MapPin size={10} style={{ marginTop: 1, flexShrink: 0, color: 'var(--amber)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.location?.address?.slice(0, 35)}...
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--amber)', fontWeight: 700 }}>
                        {req.estimatedCost ? `$${req.estimatedCost}` : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td>{statusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Home dashboard
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span>Admin</span> Dashboard</h1>
          <p className="page-subtitle">Platform overview — {user?.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: 'var(--amber)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Admin Access</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/clients')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Clients</div>
          <div className="stat-value blue">{stats.totalClients || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>👥</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/mechanics')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Mechanics</div>
          <div className="stat-value green">{stats.totalMechanics || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>🔧</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/requests')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Requests</div>
          <div className="stat-value amber">{stats.totalRequests || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>📋</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value amber">{stats.pendingRequests || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>⏳</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{stats.completedRequests || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocked Users</div>
          <div className="stat-value red">{stats.blockedUsers || 0}</div>
          <div className="stat-icon" style={{ fontSize: 48 }}>🚫</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div className="card-title">Recent Requests</div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/requests')}>View All</button>
          </div>
          {requests.slice(0, 5).map(req => (
            <div key={req._id} className={`request-card ${req.status}`} style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{req.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>👤 {req.client?.name}</div>
                </div>
                {statusBadge(req.status)}
              </div>
            </div>
          ))}
          {requests.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-icon">📋</div>
              <div className="empty-title" style={{ fontSize: 14 }}>No requests yet</div>
            </div>
          )}
        </div>

        <div>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/clients')} style={{ justifyContent: 'flex-start' }}>
              <Users size={16} style={{ color: 'var(--blue)' }} /> Manage Clients ({stats.totalClients || 0})
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/mechanics')} style={{ justifyContent: 'flex-start' }}>
              <Wrench size={16} style={{ color: 'var(--green)' }} /> Manage Mechanics ({stats.totalMechanics || 0})
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/requests')} style={{ justifyContent: 'flex-start' }}>
              <FileText size={16} style={{ color: 'var(--amber)' }} /> View All Requests ({stats.totalRequests || 0})
            </button>
            <button className="btn btn-secondary" onClick={fetchAll} style={{ justifyContent: 'flex-start' }}>
              <RotateCcw size={16} /> Refresh Dashboard
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="alert alert-info" style={{ fontSize: 12 }}>
              <div><strong>Admin Note:</strong> Admins can view all requests but cannot accept them. Block/unblock users from the Clients & Mechanics pages.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
