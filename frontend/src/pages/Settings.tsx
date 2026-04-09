import React, { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await api.put('/settings', settings);
      alert('Ayarlar kaydedildi!');
    } catch (e) {
      alert('Kaydedilirken hata oluştu.');
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>Sistem Ayarları</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Bot Metin Ayarları</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Bot Karşılama Metni</label>
            <textarea 
              className="input-field" 
              rows={3}
              value={settings['bot_welcome_text'] || ''}
              onChange={(e) => handleChange('bot_welcome_text', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Adaylık Başvuru Butonu İsmi</label>
            <input 
              type="text"
              className="input-field" 
              value={settings['bot_apply_button'] || ''}
              onChange={(e) => handleChange('bot_apply_button', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Oy Ver Butonu İsmi</label>
            <input 
              type="text"
              className="input-field" 
              value={settings['bot_vote_button'] || ''}
              onChange={(e) => handleChange('bot_vote_button', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Başvurular Açık mı?</label>
            <select 
              className="input-field"
              value={settings['application_is_open'] || 'true'}
              onChange={(e) => handleChange('application_is_open', e.target.value)}
            >
              <option value="true">Evet, Açık</option>
              <option value="false">Hayır, Kapalı</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Otomatik Onaylama (Başvurular Anında Onaylanır)</label>
            <select 
              className="input-field"
              value={settings['auto_approve_applications'] || 'false'}
              onChange={(e) => handleChange('auto_approve_applications', e.target.value)}
            >
              <option value="true">Evet, Açık</option>
              <option value="false">Hayır, Kapalı</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Adayların Kendisine Oy Verebilmesi</label>
            <select 
              className="input-field"
              value={settings['allow_self_voting'] || 'false'}
              onChange={(e) => handleChange('allow_self_voting', e.target.value)}
            >
              <option value="true">İzin Ver</option>
              <option value="false">Yasakla</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>Ayarları Kaydet</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
