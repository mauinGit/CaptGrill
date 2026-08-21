'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Modal from '@/components/Modal';

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
  const [detailModalItem, setDetailModalItem] = useState(null);
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

  // Payment breakdown
  const paymentBreakdown = { Cash: 0, Grab: 0, QRIS: 0, GoFood: 0 };
  filteredTransactions.forEach((t) => {
    const method = t.paymentMethod || 'Cash';
    if (paymentBreakdown.hasOwnProperty(method)) {
      paymentBreakdown[method] += t.finalPrice;
    } else {
      paymentBreakdown['Cash'] += t.finalPrice;
    }
  });

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📜 Riwayat Transaksi Hari Ini</h1>
          <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {transactions.length > 0 && (
        <>
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="summary-card">
              <div className="summary-card-icon orange hide-mobile">🛒</div>
              <div className="summary-card-info">
                <h3>Total Transaksi</h3>
                <div className="value">{filteredTransactions.length}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon green hide-mobile">💰</div>
              <div className="summary-card-info">
                <h3>Total Pendapatan</h3>
                <div className="value">{formatCurrency(totalToday)}</div>
              </div>
            </div>
          </div>
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginTop: '12px' }}>
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <div className="summary-card" key={method}>
                <div className="summary-card-info">
                  <h3>{method}</h3>
                  <div className="value" style={{ fontSize: '16px' }}>{formatCurrency(amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card" style={{ marginTop: '16px' }}>
        {/* Shift Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="btn-group">
            {['Semua', 'Shift 1', 'Shift 2'].map((s) => (
              <button
                key={s}
                className={`btn ${shiftFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => setShiftFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada transaksi {shiftFilter !== 'Semua' ? `untuk ${shiftFilter}` : 'hari ini'}</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No Order</th>
                  <th>Waktu</th>
                  <th>Item</th>
                  <th>Shift</th>
                  <th>Total</th>
                  <th>Diskon</th>
                  <th style={{ textAlign: 'center' }}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const dateFormatted = new Date(t.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const shiftCode = getTransactionShift(t.createdAt) === 'Shift 1' ? 'S1' : 'S2';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '700' }}>{t.orderNumber || `#${t.id}`}</td>
                      <td style={{ fontSize: '13px' }}>{dateFormatted}</td>
                      <td style={{ fontWeight: '600' }}>{t.details?.length || 0}</td>
                      <td>
                        <span className={`badge ${shiftCode === 'S1' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '11px', fontWeight: '700' }}>
                          {shiftCode}
                        </span>
                      </td>
                      <td className="font-bold text-success">{formatCurrency(t.finalPrice)}</td>
                      <td>{t.discount > 0 ? formatCurrency(t.discount) : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailModalItem(t)}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          🔍 Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Detail Pemesanan */}
      {detailModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalItem(null)}
          title={`Detail Pemesanan ${detailModalItem.orderNumber || '#' + detailModalItem.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>📅 Tanggal: <strong>{new Date(detailModalItem.createdAt).toLocaleString('id-ID')}</strong></div>
              <div>👤 Kasir: <strong>{detailModalItem.user?.name || '-'}</strong></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>💳 Metode: <strong>{detailModalItem.paymentMethod || 'Cash'}</strong></div>
              <div>⏱️ Shift: <strong>{getTransactionShift(detailModalItem.createdAt)} ({getTransactionShift(detailModalItem.createdAt) === 'Shift 1' ? 'S1' : 'S2'})</strong></div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Daftar Menu Dipesan:</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Item Menu</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Harga</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModalItem.details?.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: '600' }}>{d.menu?.name || 'Item'}</td>
                        <td style={{ textAlign: 'center' }}>x{d.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(d.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(detailModalItem.totalPrice || detailModalItem.finalPrice + (detailModalItem.discount || 0))}</span>
              </div>
              {detailModalItem.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--danger)' }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(detailModalItem.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', marginTop: '4px' }}>
                <span>TOTAL AKHIR</span>
                <span className="text-success">{formatCurrency(detailModalItem.finalPrice)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
