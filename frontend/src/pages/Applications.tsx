import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

interface Application {
  id: number;
  candidateId: number;
  status: string;
  notes: string | null;
  createdAt: string;
  candidate: {
    displayName: string;
    username: string;
    telegramId: string;
    age: number;
    reason: string;
  };
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const changeStatus = async (id: number, status: string) => {
    if (!window.confirm(`Durumu değiştirmek istediğinize emin misiniz?`)) return;
    try {
      await api.patch(`/applications/${id}/status`, { status });
      fetchApps();
    } catch (e) {
      alert('Hata oluştu');
    }
  };

  const deleteApplication = async (id: number) => {
    if (!window.confirm('Bu başvuruyu (ve varsa adaylık profilini) kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/applications/${id}`);
      fetchApps();
    } catch (e) {
      alert('Silinemedi.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Başvurular</h1>
      
      <div className="glass-panel" style={{ overflow: 'x-auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Aday</th>
              <th>Yaş</th>
              <th>Neden?</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center' }}>Yükleniyor...</td></tr>}
            {!loading && applications.map(app => (
              <tr key={app.id}>
                <td>#{app.id}</td>
                <td>
                  <div>{app.candidate.displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{app.candidate.username}</div>
                </td>
                <td>{app.candidate.age}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.candidate.reason}>
                  {app.candidate.reason}
                </td>
                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge badge-${app.status.toLowerCase()}`}>
                    {app.status === 'PENDING' ? 'Bekliyor' : app.status === 'APPROVED' ? 'Onaylandı' : app.status === 'REJECTED' ? 'Reddedildi' : 'Kara Liste'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {app.status === 'PENDING' && (
                      <>
                        <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => changeStatus(app.id, 'APPROVED')}>Onayla</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => changeStatus(app.id, 'REJECTED')}>Reddet</button>
                      </>
                    )}
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }} onClick={() => deleteApplication(app.id)}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && applications.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Henüz başvuru bulunmuyor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Applications;
