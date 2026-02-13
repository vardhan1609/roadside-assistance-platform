import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, MapPin, Loader } from 'lucide-react';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    specialization: '', vehicleType: '', licenseNumber: ''
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let user;
      if (tab === 'login') {
        user = await login(form.email, form.password);
      } else {
        const payload = { name: form.name, email: form.email, password: form.password, phone: form.phone, role };
        if (role === 'mechanic') {
          payload.specialization = form.specialization;
          payload.vehicleType = form.vehicleType;
          payload.licenseNumber = form.licenseNumber;
        }
        user = await signup(payload);
      }
      toast.success(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}! 🚗`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'mechanic') navigate('/mechanic');
      else navigate('/client');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-title">Road<span style={{ color: 'var(--amber)' }}>Aid</span></div>
          <div className="auth-logo-subtitle">Roadside Assistance Platform</div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Sign In
          </button>
          <button className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
            Create Account
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <>
              <div className="form-label" style={{ marginBottom: 8 }}>I am a...</div>
              <div className="role-selector">
                <button type="button" className={`role-option${role === 'client' ? ' selected' : ''}`} onClick={() => setRole('client')}>
                  <div className="role-option-label">Client</div>
                  <div className="role-option-desc">Need roadside help</div>
                </button>
                <button type="button" className={`role-option${role === 'mechanic' ? ' selected' : ''}`} onClick={() => setRole('mechanic')}>
                  <div className="role-option-label">Mechanic</div>
                  <div className="role-option-desc">Provide assistance</div>
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="+1 234 567 8900" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </div>

              {role === 'mechanic' && (
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <select className="form-select" value={form.specialization} onChange={e => set('specialization', e.target.value)} required>
                    <option value="">Select specialization</option>
                    <option value="General Mechanic">General Mechanic</option>
                    <option value="Tire Specialist">Tire Specialist</option>
                    <option value="Electrical Expert">Electrical Expert</option>
                    <option value="Towing Service">Towing Service</option>
                    <option value="Locksmith">Locksmith</option>
                    <option value="Engine Specialist">Engine Specialist</option>
                  </select>
                </div>
              )}
              {role === 'mechanic' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input className="form-input" placeholder="LIC-12345" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicles Served</label>
                    <select className="form-select" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} required>
                      <option value="">Select type</option>
                      <option value="All Vehicles">All Vehicles</option>
                      <option value="Cars Only">Cars Only</option>
                      <option value="Motorcycles">Motorcycles</option>
                      <option value="Heavy Vehicles">Heavy Vehicles</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={{ paddingRight: 44 }}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</> : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {tab === 'login' && (
          <div className="auth-footer" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px', background: 'var(--dark-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-dim)' }}>Demo Admin Login:</div>
              <div>Create admin at: POST /api/auth/create-admin</div>
              <div style={{ marginTop: 2 }}>Secret: ROADSIDE_ADMIN_2024</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
