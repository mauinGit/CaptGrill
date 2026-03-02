'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchData = () => {
    setLoading(true);
    let url = '/api/log?limit=500';
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setLogs(data); setPage(1); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, [from, to]);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📝 Log Aktivitas</h1>
          <p>Riwayat aktivitas seluruh pengguna</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: '8px' }}>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: '160px' }} />
          {(from || to) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFrom(''); setTo(''); }}>✕ Reset</button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada log</p></div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Detail</th></tr></thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                      <td style={{ fontWeight: '600' }}>
                        {log.user?.name || '-'}
                        {log.user?.role && <span className="badge badge-info" style={{ marginLeft: '6px' }}>{log.user.role}</span>}
                      </td>
                      <td><span className="badge badge-warning">{log.action}</span></td>
                      <td style={{ fontSize: '13px' }}>{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page - 1)} disabled={page === 1}>‹</button>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '0 8px' }}>
                  Halaman {page} dari {totalPages} ({logs.length} data)
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>›</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
