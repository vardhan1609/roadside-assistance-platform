import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, MapPin, Clock, Car, DollarSign, RotateCcw, Wrench, User } from 'lucide-react';

const SERVICE_ICONS = {
  flat_tire: '🛞', battery_jump: '🔋', fuel_delivery: '⛽',
  towing: '🚛', lockout: '🔑', engine_trouble: '⚙️', accident: '⚠️', other: '🔧'
};

const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;

function AcceptModal({ req, onClose, onAccept }) {
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cost || Number(cost) <= 0) return toast.error('Please enter a valid cost estimate');
    setLoading(true);
    try {
      await onAccept(req._id, Number(cost), note);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Accept Request</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{req.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{req.description}</div>
          <div className="map-preview" style={{ marginTop: 10 }}>
            <MapPin size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 12 }}>{req.location?.address}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Estimated Cost (INR) *</label>
            <input
              className="form-input" type="number" min="1" step="0.01"
              placeholder="Enter your service fee estimate e.g. 75.00"
              value={cost} onChange={e => setCost(e.target.value)} required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message to Client</label>
            <textarea className="form-textarea" placeholder="I'll be there in 20 minutes..." value={note} onChange={e => setNote(e.target.value)} style={{ minHeight: 70 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button className="btn btn-success" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <CheckCircle size={15} />}
              Accept Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ req, onClose, onReject }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Reject Request</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-dim)' }}>
          Rejecting: <strong style={{ color: 'var(--text)' }}>{req.title}</strong>
        </div>
        <div className="form-group">
          <label className="form-label">Reason (optional)</label>
          <input className="form-input" placeholder="Not available in this area..." value={reason} onChange={e => setReason(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Go Back</button>
          <button className="btn btn-danger" disabled={loading} onClick={async () => {
            setLoading(true);
            await onReject(req._id, reason);
            setLoading(false);
            onClose();
          }} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <XCircle size={15} />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MechanicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptModal, setAcceptModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [filter, setFilter] = useState('pending');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/mechanic/requests');
      setRequests(res.data.requests);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (id, cost, note) => {
    try {
      await axios.patch(`/mechanic/requests/${id}/accept`, { estimatedCost: cost, mechanicNote: note });
      toast.success('Job accepted! Head to the client\'s location ');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
      throw err;
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await axios.patch(`/mechanic/requests/${id}/reject`, { reason });
      toast.success('Request rejected');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleComplete = async (id) => {
    const finalCost = prompt('Enter final cost (or leave empty for estimated):');
    try {
      await axios.patch(`/mechanic/requests/${id}/complete`, { finalCost: finalCost ? Number(finalCost) : undefined });
      toast.success('Job marked as completed! ');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    }
  };

  const path = window.location.pathname;
  const isMyJobs = path.includes('my-jobs');

  const pendingJobs = requests.filter(r => r.status === 'pending');
  const myJobs = requests.filter(r => r.mechanic?._id === user?._id || r.mechanic === user?._id);
  const displayJobs = isMyJobs ? myJobs : pendingJobs;

  const stats = {
    available: pendingJobs.length,
    active: myJobs.filter(r => r.status === 'accepted' || r.status === 'in_progress').length,
    completed: myJobs.filter(r => r.status === 'completed').length,
    earned: myJobs.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.finalCost || r.estimatedCost || 0), 0),
  };

  const filterStatuses = isMyJobs ? ['all', 'accepted', 'in_progress', 'completed', 'rejected'] : ['pending'];
  const [subFilter, setSubFilter] = useState('all');
  const filteredDisplay = subFilter === 'all' ? displayJobs : displayJobs.filter(r => r.status === subFilter);

  return (
    <div>
      {acceptModal && <AcceptModal req={acceptModal} onClose={() => setAcceptModal(null)} onAccept={handleAccept} />}
      {rejectModal && <RejectModal req={rejectModal} onClose={() => setRejectModal(null)} onReject={handleReject} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isMyJobs ? <>My <span>Jobs</span></> : <>Available <span>Jobs</span></>}
          </h1>
          <p className="page-subtitle">
            Welcome, {user?.name?.split(' ')[0]} — {user?.specialization}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchRequests}><RotateCcw size={14} /> Refresh</button>
      </div>

      {!isMyJobs && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Available Jobs</div>
            <div className="stat-value amber">{stats.available}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Jobs</div>
            <div className="stat-value blue">{stats.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value green">{stats.completed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Earned</div>
            <div className="stat-value green">₹{stats.earned.toFixed(0)}</div>
           
          </div>
        </div>
      )}

      {isMyJobs && (
        <div className="filter-bar" style={{ marginBottom: 20 }}>
          {filterStatuses.map(s => (
            <button key={s} className={`filter-btn${subFilter === s ? ' active' : ''}`} onClick={() => setSubFilter(s)}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto', display: 'block' }} /></div>
      ) : filteredDisplay.length === 0 ? (
        <div className="empty-state">
            <div className="empty-title">{isMyJobs ? 'No jobs found' : 'No pending jobs'}</div>
          <div className="empty-desc">{isMyJobs ? 'Your accepted jobs will appear here' : 'Check back soon for new service requests'}</div>
        </div>
      ) : filteredDisplay.map(req => (
        <div key={req._id} className={`request-card ${req.status}`}>
          <div className="request-card-header">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {/* <span style={{ fontSize: 20 }}>{SERVICE_ICONS[req.serviceType] || '🔧'}</span> */}
                <div className="request-title">{req.title}</div>
              </div>
              <div className="request-meta">
                <span><User size={12} /> {req.client?.name}</span>
                <span>phone {req.client?.phone}</span>
                <span><Car size={12} /> {req.vehicleType} — {req.vehicleModel || 'N/A'}</span>
                <span><Clock size={12} /> {new Date(req.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {statusBadge(req.status)}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
            {req.description.slice(0, 120)}{req.description.length > 120 ? '...' : ''}
          </div>

          <div className="map-preview" style={{ marginBottom: 12 }}>
            <MapPin size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 12 }}>{req.location?.address}</span>
          </div>

          {req.estimatedCost && (
            <div style={{ marginBottom: 10 }}>
              <span className="cost-tag">Est. ₹{req.estimatedCost}</span>
              {req.finalCost && <span style={{ marginLeft: 12, color: 'var(--green)', fontWeight: 700 }}>Final: ₹{req.finalCost}</span>}
            </div>
          )}

          <div className="request-actions">
            {req.status === 'pending' && (
              <>
                <button className="btn btn-success btn-sm" onClick={() => setAcceptModal(req)}>
                  <CheckCircle size={13} /> Accept Job
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(req)}>
                  <XCircle size={13} /> Reject
                </button>
              </>
            )}
            {(req.status === 'accepted' || req.status === 'in_progress') && (
              <button className="btn btn-primary btn-sm" onClick={() => handleComplete(req._id)}>
                <CheckCircle size={13} /> Mark Complete
              </button>
            )}
            {req.status === 'completed' && (
              <span style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={13} /> Completed on {new Date(req.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
