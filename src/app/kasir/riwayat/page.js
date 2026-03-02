'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/transaksi?date=${today}`)
      .then((r) => r.json())
      .then((data) => { setTransactions(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const totalToday = transactions.reduce((sum, t) => sum + t.finalPrice, 0);

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
              <div className="value">{transactions.length}</div>
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
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada transaksi hari ini</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>No</th><th>Waktu</th><th>Item</th><th>Diskon</th><th>Total</th><th>Detail</th></tr></thead>
              <tbody>
                {transactions.map((t, i) => (
                  <>
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      <td>{i + 1}</td>
                      <td style={{ fontSize: '12px' }}>{formatDateTime(t.createdAt)}</td>
                      <td>{t.details?.length} item</td>
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
                        <td colSpan={2} style={{ fontSize: '13px' }}>{formatCurrency(d.subtotal)}</td>
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
