import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

const Elections: React.FC = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const fetchElections = async () => {
    try {
      const res = await api.get('/elections');
      setElections(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/elections/${id}`, { status });
      fetchElections();
    } catch (e) {
      alert('Hata!');
    }
  };

  const createElection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/elections', {
        title: newTitle,
        votesPerUser: 1,
        canChangeVote: false,
        isSecret: false
      });
      setShowModal(false);
      setNewTitle('');
      fetchElections();
    } catch (e) {
      alert('Oluşturulamadı');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Oylamalar</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Yeni Oylama Oluştur</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>Yeni Oylama Ekle</h2>
            <form onSubmit={createElection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Oylama Başlığı</label>
                <input required type="text" className="input-field" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Örn: Nisan 2026 Yönetim Oylaması" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary w-full">Oluştur</button>
                <button type="button" className="btn" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}} onClick={() => setShowModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'x-auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Başlık</th>
              <th>Durum</th>
              <th>Oy Sayısı</th>
              <th>Gizli Oylama</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Yükleniyor...</td></tr>}
            {!loading && elections.map(elec => (
              <tr key={elec.id}>
                <td>#{elec.id}</td>
                <td>{elec.title}</td>
                <td><span className={`badge`}>{elec.status}</span></td>
                <td>{elec._count.votes}</td>
                <td>{elec.isSecret ? 'Evet' : 'Hayır'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {elec.status !== 'ACTIVE' && (
                      <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => updateStatus(elec.id, 'ACTIVE')}>Başlat</button>
                    )}
                    {elec.status === 'ACTIVE' && (
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => updateStatus(elec.id, 'ENDED')}>Bitir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && elections.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıtlı oylama bulunmuyor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Elections;
