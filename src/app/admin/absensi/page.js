'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function AbsensiAdminPage() {
  const toast = useToast();
  const [attendances, setAttendances] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [photoPopup, setPhotoPopup] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const openRejectModal = (attendance) => {
    setRejectTarget(attendance);
    setRejectReason('');
    setRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/absensi/${rejectTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectReason }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(`Absensi ${rejectTarget.user?.name} berhasil ditolak`);
      setRejectModal(false);
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || 'Gagal menolak absensi');
    }
  };

  const purposeColors = {
    'Shift 1': 'badge-info',
    'Shift 2': 'badge-secondary',
    'Buat Bahan': 'badge-warning',
  };

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📅 Absensi Karyawan</h1>
          <p>Review dan validasi absensi semua karyawan</p>
        </div>
      </div>

      {/* Filter */}
      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>Dari:</label>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>Sampai:</label>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: '160px' }} />
          {(from || to) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setFrom(''); setTo(''); }}>✕ Reset</button>
          )}
        </div>
        <div className="toolbar-right">
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Valid
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
              Ditolak
            </span>
          </div>
        </div>
      </div>

      {/* Table for Tablet & Laptop (>= 768px) */}
      <div className="card hide-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : attendances.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada data absensi</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Tujuan</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Foto</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => {
                  const isDitolak = a.status === 'DITOLAK';
                  return (
                    <tr
                      key={a.id}
                      style={{
                        opacity: isDitolak ? 0.65 : 1,
                        background: isDitolak ? 'rgba(239,68,68,0.03)' : undefined,
                      }}
                    >
                      {/* Karyawan */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0,
                          }}>
                            {a.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{a.user?.name}</div>
                            {isDitolak && a.rejectReason && (
                              <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>
                                ✗ {a.rejectReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td style={{ fontSize: '13px' }}>{formatDate(a.date)}</td>

                      {/* Tujuan */}
                      <td>
                        <span className={`badge ${purposeColors[a.purpose] || 'badge-secondary'}`} style={{ fontSize: '11px' }}>
                          {a.purpose === 'Shift 1' ? '🌅' : a.purpose === 'Shift 2' ? '🌙' : '🧪'} {a.purpose || 'Shift 1'}
                        </span>
                      </td>

                      {/* Jam Masuk */}
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {a.clockIn ? new Date(a.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      {/* Jam Keluar */}
                      <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        {a.clockOut
                          ? new Date(a.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>

                      {/* Foto */}
                      <td>
                        {a.photo ? (
                          <img
                            src={a.photo}
                            alt="Foto absensi"
                            style={{
                              width: '40px', height: '40px', borderRadius: '8px',
                              objectFit: 'cover', cursor: 'pointer',
                              transition: 'transform 0.2s',
                              border: '2px solid var(--border)',
                              filter: isDitolak ? 'grayscale(0.5)' : 'none',
                            }}
                            onClick={() => setPhotoPopup({ photo: a.photo, name: a.user?.name, date: a.date, time: a.clockIn })}
                            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                          />
                        ) : (
                          <span style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>

                      {/* Lokasi */}
                      <td>
                        {a.latitude && a.longitude ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>✓ Sesuai</span>
                        ) : (
                          <span className="badge badge-secondary" style={{ fontSize: '11px' }}>⚠ N/A</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        {isDitolak ? (
                          <span className="badge badge-danger" style={{ fontSize: '11px' }}>✗ Ditolak</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>✓ Valid</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td>
                        {!isDitolak ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => openRejectModal(a)}
                            title="Tolak absensi ini"
                          >
                            ✗ Tolak
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sudah ditolak</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card List for Mobile HP (< 768px) */}
      <div className="show-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : attendances.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada data absensi</p></div>
        ) : (
          <div className="mobile-card-list">
            {attendances.map((a) => {
              const isDitolak = a.status === 'DITOLAK';
              return (
                <div key={a.id} className="mobile-card" style={{ opacity: isDitolak ? 0.7 : 1, background: isDitolak ? 'rgba(239,68,68,0.03)' : undefined }}>
                  <div className="mobile-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '13px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {a.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{a.user?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{formatDate(a.date)}</div>
                      </div>
                    </div>
                    {isDitolak ? (
                      <span className="badge badge-danger" style={{ fontSize: '10px' }}>✗ Ditolak</span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>✓ Valid</span>
                    )}
                  </div>

                  <div className="mobile-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className={`badge ${purposeColors[a.purpose] || 'badge-secondary'}`} style={{ fontSize: '11px' }}>
                        {a.purpose === 'Shift 1' ? '🌅' : a.purpose === 'Shift 2' ? '🌙' : '🧪'} {a.purpose || 'Shift 1'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Jam: {a.clockIn ? new Date(a.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>

                    {isDitolak && a.rejectReason && (
                      <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
                        ✗ Alasan: {a.rejectReason}
                      </div>
                    )}
                  </div>

                  <div className="mobile-card-footer">
                    {a.photo ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPhotoPopup({ photo: a.photo, name: a.user?.name, date: a.date, time: a.clockIn })}
                      >
                        📸 Lihat Foto
                      </button>
                    ) : <div />}

                    {!isDitolak && (
                      <button className="btn btn-danger btn-sm" onClick={() => openRejectModal(a)}>
                        ✗ Tolak
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="✗ Tolak Absensi">
        {rejectTarget && (
          <form onSubmit={handleReject}>
            <div className="modal-body">
              <div style={{
                padding: '12px 16px',
                background: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239,68,68,0.2)',
                marginBottom: '20px',
                fontSize: '13px',
              }}>
                <strong>{rejectTarget.user?.name}</strong> — {formatDate(rejectTarget.date)} ({rejectTarget.purpose})
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Alasan Penolakan *</label>
                <textarea
                  className="form-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Foto buram, tidak bisa dipastikan identitasnya"
                  required
                  rows={3}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  💡 Alasan akan terlihat di rekap absensi. Data tidak dihapus — hanya status berubah ke Ditolak.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setRejectModal(false)}>Batal</button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={!rejectReason.trim() || submitting}
              >
                {submitting ? '⏳ Memproses...' : '✗ Konfirmasi Tolak'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Photo Popup Modal */}
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
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}
              />
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
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
