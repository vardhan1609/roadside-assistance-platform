import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import {
  Plus, MapPin, Clock, CheckCircle, XCircle, Loader,
  Car, AlertTriangle, FileText, RotateCcw, Navigation
} from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'flat_tire', label: 'Flat Tire' },
  { value: 'battery_jump', label: 'Battery Jump' },
  { value: 'fuel_delivery', label: 'Fuel Delivery' },
  { value: 'towing', label: 'Towing' },
  { value: 'lockout', label: 'Car Lockout' },
  { value: 'engine_trouble', label: 'Engine Trouble' },
  { value: 'accident', label: 'Accident' },
  { value: 'other', label: 'Other' },
];

const VEHICLE_TYPES = ['car', 'motorcycle', 'truck', 'van', 'bus', 'other'];

const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-icon" style={{ fontSize: 48 }}>{icon}</div>
    </div>
  );
}

function RequestCard({ req, onCancel, onClick }) {
  return (
    <div className={`request-card ${req.status}`} onClick={onClick}>
      <div className="request-card-header">
        <div>
          <div className="request-title">{req.title}</div>
          <div className="request-meta">
            <span><Car size={12} /> {req.vehicleType} — {req.vehicleModel || 'Unknown model'}</span>
            <span><Clock size={12} /> {new Date(req.createdAt).toLocaleDateString()}</span>
            <span><MapPin size={12} /> {req.location?.address?.slice(0, 40)}...</span>
          </div>
        </div>
        {statusBadge(req.status)}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="chip">{SERVICE_TYPES.find(s => s.value === req.serviceType)?.icon} {req.serviceType?.replace('_', ' ')}</span>
        {req.estimatedCost && <span className="cost-tag" style={{ fontSize: 14 }}>Est. ${req.estimatedCost}</span>}
        {req.mechanic && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>🔧 {req.mechanic.name}</span>}
      </div>
      {['pending', 'accepted'].includes(req.status) && (
        <div className="request-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-sm btn-danger" onClick={() => onCancel(req._id)}>
            <XCircle size={13} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function NewRequestPage({ onCreated }) {
  const { getLocation, locLoading, locError } = useLocation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', serviceType: '', vehicleType: '',
    vehicleModel: '', vehiclePlate: '', clientNote: '',
    location: { latitude: '', longitude: '', address: '' }
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setLoc = (loc) => setForm(p => ({ ...p, location: loc }));

  const handleAutoLocation = async () => {
    try {
      const loc = await getLocation();
      setLoc(loc);
      toast.success('Location detected!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location.latitude) return toast.error('Please provide your location');
    setLoading(true);
    try {
      const res = await axios.post('/requests', form);
      toast.success('Request created successfully!');
      onCreated && onCreated(res.data.request);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New <span>Request</span></h1>
          <p className="page-subtitle">Describe your roadside emergency and we'll send help</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Request Title *</label>
            <input className="form-input" placeholder="e.g., Flat tire on highway" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Service Type *</label>
              <select className="form-select" value={form.serviceType} onChange={e => set('serviceType', e.target.value)} required>
                <option value="">Select service</option>
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Type *</label>
              <select className="form-select" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} required>
                <option value="">Select vehicle</option>
                {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vehicle Model</label>
              <input className="form-input" placeholder="e.g., Toyota Camry 2020" value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">License Plate</label>
              <input className="form-input" placeholder="ABC-1234" value={form.vehiclePlate} onChange={e => set('vehiclePlate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" placeholder="Describe the problem in detail..." value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Your Location *</label>
            <div className="location-input-wrapper">
              <input
                className="form-input has-btn"
                placeholder="Click 'Auto Detect' or enter address manually"
                value={form.location.address}
                onChange={e => setLoc({ ...form.location, address: e.target.value })}
                required
              />
              <button type="button" className="location-btn" onClick={handleAutoLocation} disabled={locLoading}>
                {locLoading ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : <Navigation size={10} />}
                {locLoading ? 'Detecting...' : 'Auto Detect'}
              </button>
            </div>
            {locError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{locError}</div>}
            {form.location.latitude && (
              <div style={{ color: 'var(--green)', fontSize: 12, marginTop: 4 }}>
                📍 GPS: {Number(form.location.latitude).toFixed(5)}, {Number(form.location.longitude).toFixed(5)}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Additional Notes</label>
            <input className="form-input" placeholder="Any other info for the mechanic..." value={form.clientNote} onChange={e => set('clientNote', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending...</> : <><Plus size={16} /> Create Request</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestsList({ requests, loading, onCancel, onRefresh, onSelectReq }) {
  const [filter, setFilter] = useState('all');
  const statuses = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My <span>Requests</span></h1>
          <p className="page-subtitle">{requests.length} total requests</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}><RotateCcw size={14} /> Refresh</button>
      </div>

      <div className="filter-bar">
        {statuses.map(s => (
          <button key={s} className={`filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No requests found</div>
          <div className="empty-desc">No {filter !== 'all' ? filter : ''} requests to display</div>
        </div>
      ) : filtered.map(req => (
        <RequestCard key={req._id} req={req} onCancel={onCancel} onClick={() => onSelectReq(req)} />
      ))}
    </div>
  );
}

function RequestDetail({ req, onBack, onCancel }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{req.title}</h1>
          <p className="page-subtitle">Request ID: {req._id}</p>
        </div>
        {statusBadge(req.status)}
      </div>

      <div className="card">
        <div className="detail-grid">
          <div>
            <div className="info-row"><span className="info-row-icon"><Car size={14} /></span><span className="info-row-label">Vehicle</span><span className="info-row-value">{req.vehicleType} — {req.vehicleModel || 'N/A'}</span></div>
            <div className="info-row"><span className="info-row-icon">🔧</span><span className="info-row-label">Service</span><span className="info-row-value">{req.serviceType?.replace('_', ' ')}</span></div>
            <div className="info-row"><span className="info-row-icon"><Clock size={14} /></span><span className="info-row-label">Created</span><span className="info-row-value">{new Date(req.createdAt).toLocaleString()}</span></div>
            {req.vehiclePlate && <div className="info-row"><span className="info-row-icon">🪪</span><span className="info-row-label">Plate</span><span className="info-row-value">{req.vehiclePlate}</span></div>}
          </div>
          <div>
            {req.mechanic ? (
              <>
                <div className="info-row"><span className="info-row-label">Mechanic</span><span className="info-row-value">{req.mechanic.name}</span></div>
                <div className="info-row"><span className="info-row-label">Phone</span><span className="info-row-value">{req.mechanic.phone}</span></div>
                <div className="info-row"><span className="info-row-label">Rating</span><span className="info-row-value">{req.mechanic.rating || 'N/A'}</span></div>
              </>
            ) : (
              <div className="alert alert-info">Waiting for a mechanic to accept your request...</div>
            )}
            {req.estimatedCost && (
              <div style={{ marginTop: 8 }}>
                <div className="detail-label">Estimated Cost</div>
                <div className="detail-value big">₹{req.estimatedCost}</div>
              </div>
            )}
          </div>
        </div>

        <hr className="divider" />

        <div className="form-group">
          <div className="detail-label">Description</div>
          <div className="detail-value" style={{ lineHeight: 1.6 }}>{req.description}</div>
        </div>

        <div className="map-preview">
          <MapPin size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Location</div>
            {req.location?.address}
            {req.location?.latitude && <div style={{ fontSize: 11, marginTop: 2 }}>GPS: {req.location.latitude.toFixed(5)}, {req.location.longitude.toFixed(5)}</div>}
          </div>
        </div>

        {req.mechanicNote && (
          <div className="alert alert-info" style={{ marginTop: 12 }}>
            <div><strong>Mechanic's Note:</strong> {req.mechanicNote}</div>
          </div>
        )}

        {['pending', 'accepted'].includes(req.status) && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-danger btn-sm" onClick={() => onCancel(req._id)}>
              <XCircle size={14} /> Cancel Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/requests');
      setRequests(res.data.requests);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Listen for route changes to determine view
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('new-request')) setView('new');
    else if (path.includes('requests')) setView('list');
    else setView('home');
  }, [navigate]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try {
      await axios.patch(`/requests/${id}/cancel`, { reason: 'Cancelled by client' });
      toast.success('Request cancelled');
      fetchRequests();
      if (view === 'detail') setView('list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    active: requests.filter(r => r.status === 'accepted' || r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  // Route-based rendering
  const path = window.location.pathname;

  if (path.includes('new-request')) {
    return <NewRequestPage onCreated={(req) => { fetchRequests(); navigate('/client/requests'); }} />;
  }
  if (path.includes('requests') && !path.includes('new')) {
    if (selectedReq) {
      return <RequestDetail req={selectedReq} onBack={() => setSelectedReq(null)} onCancel={(id) => { handleCancel(id); setSelectedReq(null); }} />;
    }
    return <RequestsList requests={requests} loading={loading} onCancel={handleCancel} onRefresh={fetchRequests} onSelectReq={setSelectedReq} />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, <span>{user?.name?.split(' ')[0]}</span></h1>
          <p className="page-subtitle">Your roadside assistance dashboard</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/client/new-request')}>
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Requests" value={stats.total} color="amber"  />
        <StatCard label="Pending" value={stats.pending} color="amber"  />
        <StatCard label="Active" value={stats.active} color="blue"  />
        <StatCard label="Completed" value={stats.completed} color="green"  />
      </div>

      <div className="card-header" style={{ marginBottom: 16 }}>
        <div className="card-title">Recent Requests</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/client/requests')}>View All</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No requests yet</div>
          <div className="empty-desc">Create your first roadside assistance request</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/client/new-request')}>
            <Plus size={14} /> Create Request
          </button>
        </div>
      ) : requests.slice(0, 4).map(req => (
        <RequestCard key={req._id} req={req} onCancel={handleCancel} onClick={() => { navigate('/client/requests'); setSelectedReq(req); }} />
      ))}
    </div>
  );
}
