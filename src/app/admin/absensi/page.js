'use client';

import { useEffect, useState } from 'react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function AbsensiAdminPage() {
  const [attendances, setAttendances] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [photoPopup, setPhotoPopup] = useState(null);

  const fetchData = async () => {
    let url = '/api/absensi';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (params.toString()) url += '?' + params.toString();

    const res = await fetch(url);
    setAttendances(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [from, to]);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📅 Absensi Karyawan</h1>
          <p>Riwayat absensi semua karyawan</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: '8px' }}>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : attendances.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada data absensi</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>No</th><th>Nama</th><th>Tanggal</th><th>Jam Masuk</th><th>Tujuan</th><th>Foto</th><th>Lokasi</th></tr>
              </thead>
              <tbody>
                {attendances.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{a.user?.name}</td>
                    <td>{formatDate(a.date)}</td>
                    <td>{new Date(a.clockIn).toLocaleTimeString('id-ID')}</td>
                    <td><span className="badge badge-info">{a.purpose || 'Shift 1'}</span></td>
                    <td>
                      {a.photo ? (
                        <img
                          src={a.photo}
                          alt="Foto"
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }}
                          onClick={() => setPhotoPopup({ photo: a.photo, name: a.user?.name, date: a.date, time: a.clockIn })}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        />
                      ) : (
                        <span className="text-secondary">-</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {a.latitude && a.longitude ? (
                        <span className="badge badge-success">✅ Valid</span>
                      ) : (
                        <span className="badge badge-warning">⚠️ N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Popup */}
      {photoPopup && (
        <div className="modal-overlay" onClick={() => setPhotoPopup(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>📸 Foto Absensi</h2>
              <button className="modal-close" onClick={() => setPhotoPopup(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <img
                src={photoPopup.photo}
                alt="Foto absensi"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: '12px',
                  objectFit: 'contain',
                  marginBottom: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              />
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {photoPopup.name}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {formatDate(photoPopup.date)} • {new Date(photoPopup.time).toLocaleTimeString('id-ID')}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPhotoPopup(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
