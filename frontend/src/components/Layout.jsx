import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wrench, Car, Users, FileText,
  LogOut, Menu, X, Settings, MapPin, Shield
} from 'lucide-react';

const navConfig = {
  client: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/client' },
    { label: 'My Requests', icon: FileText, path: '/client/requests' },
    { label: 'New Request', icon: Car, path: '/client/new-request' },
  ],
  mechanic: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/mechanic' },
    { label: 'Available Jobs', icon: Wrench, path: '/mechanic/jobs' },
    { label: 'My Jobs', icon: FileText, path: '/mechanic/my-jobs' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'All Requests', icon: FileText, path: '/admin/requests' },
    { label: 'Clients', icon: Users, path: '/admin/clients' },
    { label: 'Mechanics', icon: Wrench, path: '/admin/mechanics' },
  ]
};

const roleColors = { client: 'client', mechanic: 'mechanic', admin: 'admin' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = navConfig[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => {
    if (path === `/client` || path === `/mechanic` || path === `/admin`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div>
              <div className="logo-text">Road<span>Aid</span></div>
              <div className="logo-subtitle">Assistance Platform</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={`role-dot ${roleColors[user?.role]}`} />
              {user?.role}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Mobile topbar */}
        <div className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>RoadAid</span>
          </div>
          <div className="user-avatar" style={{ cursor: 'pointer' }}>{initials}</div>
        </div>

        {children}
      </div>
    </div>
  );
}
