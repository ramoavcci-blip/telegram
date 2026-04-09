import React, { useEffect, useState } from 'react';
import { Users, FileText, CheckSquare, UserX } from 'lucide-react';
import { api } from '../context/AuthContext';

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  approvedCandidates: number;
  rejectedApplications: number;
  blacklistedCandidates: number;
  totalVotes: number;
  activeElection: { id: number; title: string } | null;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard</h1>
      
      {stats && (
        <div className="stats-grid">
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <h3>Bekleyen Başvurular</h3>
            <div className="value">{stats.pendingApplications}</div>
            <FileText className="icon" />
          </div>
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <h3>Onaylanan Adaylar</h3>
            <div className="value">{stats.approvedCandidates}</div>
            <Users className="icon" />
          </div>
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h3>Aktif Oylama</h3>
            <div className="value" style={{ fontSize: stats.activeElection ? '1.5rem' : '1.5rem' }}>
              {stats.activeElection ? stats.activeElection.title : 'Yok'}
            </div>
            <CheckSquare className="icon" />
          </div>
          <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--error)' }}>
            <h3>Red/Kara Liste</h3>
            <div className="value">{stats.rejectedApplications + stats.blacklistedCandidates}</div>
            <UserX className="icon" />
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Hoş Geldiniz</h2>
        <p style={{ color: 'var(--text-muted)' }}>Sol menüyü kullanarak adaylık başvurularını, onaylanan adayları ve oylama süreçlerini yönetebilirsiniz.</p>
      </div>
    </div>
  );
};

export default Dashboard;
