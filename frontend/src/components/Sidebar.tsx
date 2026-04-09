import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CheckSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2rem', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.05em' }}>Yönetim Paneli</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{user?.role.toLowerCase()}</span>
        </div>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/applications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Başvurular</span>
        </NavLink>
        <NavLink to="/candidates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Adaylar</span>
        </NavLink>
        <NavLink to="/elections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} />
          <span>Oylamalar</span>
        </NavLink>
        
        {user?.role === 'SUPERADMIN' && (
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Ayarlar</span>
          </NavLink>
        )}
      </nav>

      <div style={{ paddingTop: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-light)' }}>
        <button onClick={logout} className="nav-item" style={{ width: '100%', textAlign: 'left', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};
