import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

interface Candidate {
  id: number;
  displayName: string;
  username: string;
  status: string;
  isHidden: boolean;
  _count: {
    votes: number;
  };
}

const Candidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ displayName: '', username: '', telegramId: '', reason: '' });

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const toggleHidden = async (id: number, isHidden: boolean) => {
    try {
      await api.patch(`/candidates/${id}`, { isHidden: !isHidden });
      fetchCandidates();
    } catch (e) {
      alert('Hata oluştu');
    }
  };

  const deleteCandidate = async (id: number) => {
    if (!window.confirm('Bu adayı kalıcı olarak silmek istediğinize emin misiniz? Oyları da silinecektir.')) return;
    try {
      await api.delete(`/candidates/${id}`);
      fetchCandidates();
    } catch(e) {
      alert('Aday silinemedi.');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/candidates', newCandidate);
      setShowModal(false);
      setNewCandidate({ displayName: '', username: '', telegramId: '', reason: '' });
      fetchCandidates();
    } catch (e) {
      alert('Aday eklenirken hata oluştu.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Adaylar</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Manuel Aday Ekle</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>Yeni Aday Ekle</h2>
            <form onSubmit={handleAddCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Görünen Ad</label>
                <input required type="text" className="input-field" value={newCandidate.displayName} onChange={e => setNewCandidate({...newCandidate, displayName: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Kullanıcı Adı (Opsiyonel)</label>
                <input type="text" className="input-field" value={newCandidate.username} onChange={e => setNewCandidate({...newCandidate, username: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Telegram ID (Opsiyonel ama önerilir)</label>
                <input type="text" className="input-field" value={newCandidate.telegramId} onChange={e => setNewCandidate({...newCandidate, telegramId: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary w-full">Ekle</button>
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
              <th>Adı</th>
              <th>Durum</th>
              <th>Aldığı Oy</th>
              <th>Görünürlük</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Yükleniyor...</td></tr>}
            {!loading && candidates.map(cand => (
              <tr key={cand.id}>
                <td>#{cand.id}</td>
                <td>
                  <div>{cand.displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{cand.username}</div>
                </td>
                <td>
                  <span className={`badge badge-${cand.status.toLowerCase()}`}>
                    {cand.status}
                  </span>
                </td>
                <td>{cand._count.votes}</td>
                <td>{cand.isHidden ? 'Gizli' : 'Herkese Açık'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => toggleHidden(cand.id, cand.isHidden)}>
                      {cand.isHidden ? 'Göster' : 'Gizle'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)' }} onClick={() => deleteCandidate(cand.id)}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && candidates.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Kayıtlı aday bulunmuyor.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Candidates;
