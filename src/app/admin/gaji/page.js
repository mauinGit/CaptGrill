'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';

export default function GajiPage() {
  const toast = useToast();
  const [salaries, setSalaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', period: '', shiftRate: '', produksiRate: '' });
  const [detailData, setDetailData] = useState(null);

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

  const viewDetail = async (salary) => {
    const [year, month] = salary.period.split('-');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    const res = await fetch(`/api/absensi?userId=${salary.userId}&from=${from}&to=${to}`);
    const attendances = await res.json();
    setDetailData({ salary, attendances });
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
          <button className="btn btn-primary" onClick={() => { setForm({ userId: '', period: currentPeriod, shiftRate: '50000', produksiRate: '30000' }); setModalOpen(true); }}>
            ➕ Hitung Gaji
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : salaries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💰</div><p>Belum ada data gaji</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Periode</th>
                  <th>Gaji Shift</th>
                  <th>Gaji Produksi</th>
                  <th>Total Gaji</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{s.user?.name}</td>
                    <td>{s.period}</td>
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
                    <td className="font-bold text-success">{formatCurrency(s.totalSalary)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(s)}>📋</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Attendance Modal */}
      {detailData && (
        <div className="modal-overlay" onClick={() => setDetailData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📋 Detail Gaji - {detailData.salary.user?.name}</h2>
              <button className="modal-close" onClick={() => setDetailData(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Periode: <strong>{detailData.salary.period}</strong>
              </p>

              {/* Salary Breakdown */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>🕐 Gaji Shift ({detailData.salary.shiftDays || 0} hari × {formatCurrency(detailData.salary.shiftRate || detailData.salary.dailyRate)})</span>
                  <strong>{formatCurrency(detailData.salary.gajiShift || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>🍳 Gaji Produksi ({detailData.salary.produksiDays || 0} kali × {formatCurrency(detailData.salary.produksiRate || 0)})</span>
                  <strong>{formatCurrency(detailData.salary.gajiProduksi || 0)}</strong>
                </div>
                <div style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <strong>Total Gaji</strong>
                  <strong className="text-success">{formatCurrency(detailData.salary.totalSalary)}</strong>
                </div>
              </div>

              {/* Attendance List */}
              <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>📅 Riwayat Absensi</h4>
              {detailData.attendances.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>Tidak ada data absensi</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>No</th><th>Tanggal</th><th>Jam Masuk</th><th>Tujuan</th></tr></thead>
                    <tbody>
                      {detailData.attendances.map((a, i) => (
                        <tr key={a.id}>
                          <td>{i + 1}</td>
                          <td>{new Date(a.date).toLocaleDateString('id-ID')}</td>
                          <td>{new Date(a.clockIn).toLocaleTimeString('id-ID')}</td>
                          <td>
                            <span className={`badge ${a.purpose === 'Membuat Bahan' ? 'badge-warning' : 'badge-info'}`}>
                              {a.purpose || 'Shift 1'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetailData(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

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
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Gaji per hari untuk absensi Shift 1 / Shift 2</small>
                </div>
                <div className="form-group">
                  <label className="form-label">🍳 Rate Produksi / Kali (Rp)</label>
                  <input type="number" className="form-input" value={form.produksiRate} onChange={(e) => setForm({ ...form, produksiRate: e.target.value })} placeholder="30000" />
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Gaji per aktivitas Membuat Bahan</small>
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
