'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatPeriod(periodStr) {
  if (!periodStr) return '-';
  const parts = periodStr.split('-');
  if (parts.length === 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return MONTH_NAMES[monthIndex];
    }
  }
  return periodStr;
}

export default function GajiPage() {
  const toast = useToast();
  const [salaries, setSalaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', period: '', shiftRate: '50000', produksiRate: '30000', bonus: '0', bonusNote: '' });
  const [detailData, setDetailData] = useState(null);
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    const [s, u] = await Promise.all([
      fetch('/api/gaji').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ]);
    setSalaries(s);
    setUsers(Array.isArray(u) ? u.filter((x) => x.role === 'KASIR') : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/gaji', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Gaji berhasil dihitung');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal');
    }
  };

  const handlePay = async (salaryId) => {
    if (!confirm('Yakin tandai gaji ini sebagai SUDAH DIBAYAR? Entri pengeluaran akan otomatis dibuat dan tidak bisa dibatalkan.')) return;
    setPaying(true);
    const res = await fetch(`/api/gaji/${salaryId}`, { method: 'PATCH' });
    setPaying(false);
    if (res.ok) {
      toast.success('Gaji ditandai sudah dibayar & entri pengeluaran dibuat');
      setDetailData(null);
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || 'Gagal');
    }
  };

  const currentPeriod = new Date().toISOString().substring(0, 7);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>💰 Gaji Karyawan</h1>
          <p>Perhitungan gaji berdasarkan absensi shift & produksi bahan</p>
        </div>
        <div className="navbar-right">
          <button className="btn btn-primary hide-mobile" onClick={() => { setForm({ userId: '', period: currentPeriod, shiftRate: '50000', produksiRate: '30000', bonus: '0', bonusNote: '' }); setModalOpen(true); }}>
            ➕ Hitung Gaji
          </button>
        </div>
      </div>

      {/* Table view for Tablet & Laptop (>= 768px) */}
      <div className="card hide-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : salaries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💰</div><p>Belum ada data gaji</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Periode</th>
                  <th>Gaji Shift</th>
                  <th>Gaji Produksi</th>
                  <th>Bonus</th>
                  <th>Total Gaji</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => {
                  const isPaid = s.status === 'PAID';
                  return (
                    <tr key={s.id} style={{ opacity: isPaid ? 0.75 : 1 }}>
                      <td style={{ fontWeight: '600' }}>{s.user?.name}</td>
                      <td>{formatPeriod(s.period)}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{formatCurrency(s.gajiShift || 0)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {s.shiftDays || 0} hari × {formatCurrency(s.shiftRate || s.dailyRate)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{formatCurrency(s.gajiProduksi || 0)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {s.produksiDays || 0} kali × {formatCurrency(s.produksiRate || 0)}
                        </div>
                      </td>
                      <td>
                        {(s.bonus || 0) > 0 ? (
                          <div>
                            <div style={{ fontSize: '13px', color: 'var(--primary)' }}>{formatCurrency(s.bonus)}</div>
                            {s.bonusNote && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.bonusNote}</div>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(s.totalSalary)}</td>
                      <td>
                        {isPaid ? (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>🔒 Dibayar</span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '11px' }}>Draft</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setDetailData(s)}>📋</button>
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
        ) : salaries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💰</div><p>Belum ada data gaji</p></div>
        ) : (
          <div className="mobile-card-list">
            {salaries.map((s) => {
              const isPaid = s.status === 'PAID';
              return (
                <div key={s.id} className="mobile-card" style={{ opacity: isPaid ? 0.8 : 1 }}>
                  <div className="mobile-card-header">
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.user?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Periode: {formatPeriod(s.period)}</div>
                    </div>
                    {isPaid ? (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>🔒 Dibayar</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>Draft</span>
                    )}
                  </div>

                  <div className="mobile-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Shift ({s.shiftDays || 0}x) + Produksi ({s.produksiDays || 0}x)
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>
                        {formatCurrency(s.totalSalary)}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-footer">
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Rincian lengkap</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDetailData(s)}>
                      📋 Detail & Bayar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB Button for HP (< 768px) */}
      <button
        className="fab-btn"
        onClick={() => { setForm({ userId: '', period: currentPeriod, shiftRate: '50000', produksiRate: '30000', bonus: '0', bonusNote: '' }); setModalOpen(true); }}
        title="Hitung Gaji"
      >
        +
      </button>

      {/* Detail Modal */}
      {detailData && (
        <div className="modal-overlay" onClick={() => setDetailData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>📋 Detail Gaji — {detailData.user?.name}</h2>
              <button className="modal-close" onClick={() => setDetailData(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Periode: <strong>{formatPeriod(detailData.period)}</strong>
                {detailData.status === 'PAID' && <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '10px' }}>🔒 Dibayar</span>}
              </p>

              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>🕐 Gaji Shift ({detailData.shiftDays || 0} hari × {formatCurrency(detailData.shiftRate || detailData.dailyRate)})</span>
                  <strong>{formatCurrency(detailData.gajiShift || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>🍳 Gaji Produksi ({detailData.produksiDays || 0} kali × {formatCurrency(detailData.produksiRate || 0)})</span>
                  <strong>{formatCurrency(detailData.gajiProduksi || 0)}</strong>
                </div>
                {(detailData.bonus || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>🎁 Bonus {detailData.bonusNote ? `(${detailData.bonusNote})` : ''}</span>
                    <strong style={{ color: 'var(--primary)' }}>{formatCurrency(detailData.bonus)}</strong>
                  </div>
                )}
                <div style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <strong>Total Gaji</strong>
                  <strong style={{ color: 'var(--success)' }}>{formatCurrency(detailData.totalSalary)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailData(null)}>Tutup</button>
              {detailData.status !== 'PAID' && (
                <button
                  className="btn btn-success"
                  onClick={() => handlePay(detailData.id)}
                  disabled={paying}
                >
                  {paying ? '⏳...' : '✓ Tandai Sudah Dibayar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hitung Gaji Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Hitung Gaji">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Karyawan</label>
              <select className="form-select" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
                <option value="">Pilih karyawan</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Periode (Bulan)</label>
              <input type="month" className="form-input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>💰 Komponen Gaji</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">🕐 Rate Shift / Hari (Rp)</label>
                  <input type="number" className="form-input" value={form.shiftRate} onChange={(e) => setForm({ ...form, shiftRate: e.target.value })} placeholder="50000" />
                </div>
                <div className="form-group">
                  <label className="form-label">🍳 Rate Produksi / Kali (Rp)</label>
                  <input type="number" className="form-input" value={form.produksiRate} onChange={(e) => setForm({ ...form, produksiRate: e.target.value })} placeholder="30000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">🎁 Bonus (Rp)</label>
                  <input type="number" className="form-input" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Catatan Bonus</label>
                  <input type="text" className="form-input" value={form.bonusNote} onChange={(e) => setForm({ ...form, bonusNote: e.target.value })} placeholder="Contoh: Bonus kinerja" />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">💰 Hitung</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
