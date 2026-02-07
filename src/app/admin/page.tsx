'use client';

import { useEffect, useState } from 'react';

type Settings = {
  system_prompt: string;
  site_url: string;
  candidate_link: string;
  agency_link: string;
  tone: string;
};

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>({
    system_prompt: '',
    site_url: '',
    candidate_link: '',
    agency_link: '',
    tone: '',
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const s = await fetch('/api/admin/settings', { cache: 'no-store' }).then(r => r.json());
      if (s?.error) throw new Error(s.error);
      setSettings(s);

      const h = await fetch('/api/admin/history', { cache: 'no-store' }).then(r => r.json());
      if (h?.error) throw new Error(h.error);
      setHistory(h.items || []);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const j = await res.json();
      if (!res.ok || j?.error) throw new Error(j?.error || 'Save failed');
      await loadAll();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>WA Bot Admin</h1>
      <p style={{ color: '#555', marginTop: 0 }}>Настройки сохраняются в базе. Ключи (Green/Gemini/DB) — только в Vercel ENV.</p>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #f99', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          Ошибка: {error}
        </div>
      )}

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Site URL</label>
              <input value={settings.site_url} onChange={e => setSettings({ ...settings, site_url: e.target.value })}
                     style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Tone (опционально)</label>
              <input value={settings.tone} onChange={e => setSettings({ ...settings, tone: e.target.value })}
                     style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Candidate link</label>
              <input value={settings.candidate_link} onChange={e => setSettings({ ...settings, candidate_link: e.target.value })}
                     style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Agency link</label>
              <input value={settings.agency_link} onChange={e => setSettings({ ...settings, agency_link: e.target.value })}
                     style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600 }}>SYSTEM PROMPT</label>
            <textarea value={settings.system_prompt} onChange={e => setSettings({ ...settings, system_prompt: e.target.value })}
                      rows={10}
                      style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} />
          </div>

          <button onClick={save} disabled={saving}
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #111', background: saving ? '#eee' : '#111', color: saving ? '#111' : '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Сохранение…' : 'Save'}
          </button>

          <h2 style={{ fontSize: 18, marginTop: 24 }}>Последние сообщения (200)</h2>
          <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 140px 1fr', gap: 0, background: '#fafafa', padding: '10px 12px', fontWeight: 700 }}>
              <div>Дата</div><div>Куда</div><div>Текст</div>
            </div>
            {history.map((m: any) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '180px 140px 1fr', padding: '10px 12px', borderTop: '1px solid #f2f2f2' }}>
                <div style={{ color: '#666' }}>{new Date(m.created_at).toLocaleString()}</div>
                <div>{m.direction === 'in' ? 'Входящее' : 'Исходящее'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
