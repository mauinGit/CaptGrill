'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

// Shift time helper: Shift 1 = 06:00-15:00, Shift 2 = 15:00-06:00
function getTransactionShift(createdAt) {
  const date = new Date(createdAt);
  const hour = date.getHours();
  if (hour >= 6 && hour < 15) return 'Shift 1';
  return 'Shift 2';
}

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [shiftFilter, setShiftFilter] = useState('Semua');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/transaksi?date=${today}`)
      .then((r) => r.json())
      .then((data) => { setTransactions(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (shiftFilter === 'Semua') return true;
    return getTransactionShift(t.createdAt) === shiftFilter;
  });

  const totalToday = filteredTransactions.reduce((sum, t) => sum + t.finalPrice, 0);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📜 Riwayat Transaksi Hari Ini</h1>
          <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="summary-card">
            <div className="summary-card-icon orange">🛒</div>
            <div className="summary-card-info">
              <h3>Total Transaksi</h3>
              <div className="value">{filteredTransactions.length}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-icon green">💰</div>
            <div className="summary-card-info">
              <h3>Total Pendapatan</h3>
              <div className="value">{formatCurrency(totalToday)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {/* Shift Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="btn-group">
            {['Semua', 'Shift 1', 'Shift 2'].map((s) => (
              <button
                key={s}
                className={`btn ${shiftFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setShiftFilter(s)}
              >
                {s === 'Shift 1' ? '🌅 ' : s === 'Shift 2' ? '🌙 ' : ''}{s}
              </button>
            ))}
          </div>
          {shiftFilter !== 'Semua' && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {shiftFilter === 'Shift 1' ? '🌅 06:00 — 15:00 WIB' : '🌙 15:00 — 06:00 WIB'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada transaksi {shiftFilter !== 'Semua' ? `untuk ${shiftFilter}` : 'hari ini'}</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>No</th><th>Waktu</th><th>Item</th><th>Shift</th><th>Diskon</th><th>Total</th><th>Detail</th></tr></thead>
              <tbody>
                {filteredTransactions.map((t, i) => (
                  <>
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      <td>{i + 1}</td>
                      <td style={{ fontSize: '12px' }}>{formatDateTime(t.createdAt)}</td>
                      <td>{t.details?.length} item</td>
                      <td>
                        <span className={`badge ${getTransactionShift(t.createdAt) === 'Shift 1' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                          {getTransactionShift(t.createdAt) === 'Shift 1' ? '🌅' : '🌙'} {getTransactionShift(t.createdAt)}
                        </span>
                      </td>
                      <td>{t.discount > 0 ? formatCurrency(t.discount) : '-'}</td>
                      <td className="font-bold text-success">{formatCurrency(t.finalPrice)}</td>
                      <td>{expandedId === t.id ? '🔼' : '🔽'}</td>
                    </tr>
                    {expandedId === t.id && t.details?.map((d) => (
                      <tr key={`${t.id}-${d.id}`} style={{ background: 'var(--bg-tertiary)' }}>
                        <td></td>
                        <td colSpan={2} style={{ fontSize: '13px', paddingLeft: '32px' }}>
                          ↳ {d.menu?.name}
                        </td>
                        <td style={{ fontSize: '13px' }}>x{d.quantity}</td>
                        <td colSpan={3} style={{ fontSize: '13px' }}>{formatCurrency(d.subtotal)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
