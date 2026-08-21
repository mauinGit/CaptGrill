'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import Modal from '@/components/Modal';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

// Shift time helper: Shift 1 = 06:00-15:00, Shift 2 = 15:00-06:00 (next day)
function getTransactionShift(createdAt) {
  const date = new Date(createdAt);
  const hour = date.getHours();
  if (hour >= 6 && hour < 15) return 'Shift 1';
  return 'Shift 2';
}

export default function LaporanPage() {
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [shiftFilter, setShiftFilter] = useState('Semua');

  const fetchReport = async () => {
    setLoading(true);
    const res = await fetch(`/api/laporan?from=${from}&to=${to}`);
    setData(await res.json());
    setTxPage(1);
    setShiftFilter('Semua');
    setLoading(false);
  };

  // Filter transactions by shift
  const filteredTransactions = data?.transactions?.filter((t) => {
    if (shiftFilter === 'Semua') return true;
    return getTransactionShift(t.createdAt) === shiftFilter;
  }) || [];

  const filteredIncome = filteredTransactions.reduce((sum, t) => sum + t.finalPrice, 0);

  const exportToExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['LAPORAN KEUANGAN CAPTGRILL'],
      [`Periode: ${formatDate(from)} - ${formatDate(to)}`],
      [],
      ['Keterangan', 'Jumlah'],
      ['Total Pemasukan', data.totalIncome],
      ['Total Pengeluaran', data.totalExpense],
      ['Laba / Rugi', data.profit],
      [],
      ['PEMASUKAN PER METODE PEMBAYARAN'],
      ['Cash', data.paymentBreakdown?.Cash || 0],
      ['Grab', data.paymentBreakdown?.Grab || 0],
      ['QRIS', data.paymentBreakdown?.QRIS || 0],
      ['GoFood', data.paymentBreakdown?.GoFood || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const incomeHeader = [['DETAIL PEMASUKAN'], [`Periode: ${formatDate(from)} - ${formatDate(to)}`], [], ['No', 'No Order', 'Tanggal & Waktu', 'Kasir', 'Item', 'Bayar Via', 'Shift', 'Subtotal', 'Diskon', 'Total']];
    const incomeRows = (data.transactions || []).map((t, i) => {
      const items = t.details?.map((d) => `${d.menu?.name} x${d.quantity}`).join(', ') || '-';
      return [i + 1, t.orderNumber || `#${t.id}`, new Date(t.createdAt).toLocaleString('id-ID'), t.user?.name || '-', items, t.paymentMethod || 'Cash', getTransactionShift(t.createdAt), t.totalPrice, t.discount || 0, t.finalPrice];
    });
    const totalIncome = (data.transactions || []).reduce((s, t) => s + t.finalPrice, 0);
    incomeRows.push([], ['', '', '', '', '', '', '', '', 'TOTAL', totalIncome]);
    const wsIncome = XLSX.utils.aoa_to_sheet([...incomeHeader, ...incomeRows]);
    wsIncome['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Pemasukan');

    const expenseHeader = [['DETAIL PENGELUARAN'], [`Periode: ${formatDate(from)} - ${formatDate(to)}`], [], ['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah']];
    const expenseRows = (data.expenses || []).map((e, i) => [i + 1, new Date(e.date).toLocaleDateString('id-ID'), e.category, e.description, e.amount]);
    const totalExpense = (data.expenses || []).reduce((s, e) => s + e.amount, 0);
    expenseRows.push([], ['', '', '', 'TOTAL', totalExpense]);
    const wsExpense = XLSX.utils.aoa_to_sheet([...expenseHeader, ...expenseRows]);
    wsExpense['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Pengeluaran');

    XLSX.writeFile(wb, `Laporan_CaptGrill_${from}_sd_${to}.xlsx`);
  };

  const txTotalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTx = filteredTransactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

  const Pagination = ({ current, total, onChange }) => (
    total > 1 && (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange(1)} disabled={current === 1}>«</button>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange(current - 1)} disabled={current === 1}>‹</button>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hal {current}/{total}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange(current + 1)} disabled={current === total}>›</button>
        <button className="btn btn-secondary btn-sm" onClick={() => onChange(total)} disabled={current === total}>»</button>
      </div>
    )
  );

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📋 Laporan Keuangan</h1>
          <p>Laporan pemasukan dan pengeluaran</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="date-range-row">
          <input type="date" className="form-input date-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="form-input date-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="action-row">
          {data && (
            <button className="btn btn-success btn-excel" onClick={exportToExcel}>Export Excel</button>
          )}
          <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
            {loading ? '⏳' : '🔍'} Tampilkan
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Main Summary */}
          <div className="summary-grid summary-grid-1col-mobile">
            <div className="summary-card">
              <div className="summary-card-icon green">💰</div>
              <div className="summary-card-info">
                <h3>Total Pemasukan</h3>
                <div className="value text-success">{formatCurrency(data.totalIncome)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon red">💸</div>
              <div className="summary-card-info">
                <h3>Total Pengeluaran</h3>
                <div className="value text-danger">{formatCurrency(data.totalExpense)}</div>
              </div>
            </div>
            <div className="summary-card">
              <div className={`summary-card-icon ${data.profit >= 0 ? 'green' : 'red'}`}>
                {data.profit >= 0 ? '📈' : '📉'}
              </div>
              <div className="summary-card-info">
                <h3>Laba / Rugi</h3>
                <div className={`value ${data.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(data.profit)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {data.paymentBreakdown && (
            <div className="summary-grid" style={{ marginTop: '12px' }}>
              {Object.entries(data.paymentBreakdown).map(([method, amount]) => (
                <div className="summary-card" key={method}>
                  <div className="summary-card-info">
                    <h3>{method}</h3>
                    <div className="value" style={{ fontSize: '16px' }}>{formatCurrency(amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transactions Table Card */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="card-title">💰 Transaksi ({filteredTransactions.length}){shiftFilter !== 'Semua' ? ` — ${shiftFilter}` : ''}</h3>
              <div className="btn-group">
                {['Semua', 'Shift 1', 'Shift 2'].map((s) => (
                  <button
                    key={s}
                    className={`btn ${shiftFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => { setShiftFilter(s); setTxPage(1); }}
                  >
                    {s === 'Shift 1' ? '🌅 ' : s === 'Shift 2' ? '🌙 ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>

            {shiftFilter !== 'Semua' && (
              <div style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {shiftFilter === 'Shift 1' ? '🌅 Shift 1: 06:00 — 15:00 WIB' : '🌙 Shift 2: 15:00 — 06:00 WIB'} • Total: <strong className="text-success">{formatCurrency(filteredIncome)}</strong>
              </div>
            )}

            {filteredTransactions.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>Tidak ada transaksi</p>
            ) : (
              <>
                {/* Table for Tablet & Desktop (>= 768px) */}
                <div className="table-container hide-mobile">
                  <table>
                    <thead>
                      <tr>
                        <th>No Order</th>
                        <th>Waktu</th>
                        <th>Kasir</th>
                        <th>Via</th>
                        <th>Shift</th>
                        <th>Total</th>
                        <th style={{ textAlign: 'center' }}>Detail</th>
                        <th style={{ textAlign: 'center' }}>Struk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTx.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontSize: '12px', fontWeight: '700' }}>{t.orderNumber || `#${t.id}`}</td>
                          <td style={{ fontSize: '12px' }}>{formatDateTime(t.createdAt)}</td>
                          <td>{t.user?.name || '-'}</td>
                          <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{t.paymentMethod || 'Cash'}</span></td>
                          <td>
                            <span className={`badge ${getTransactionShift(t.createdAt) === 'Shift 1' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                              {getTransactionShift(t.createdAt) === 'Shift 1' ? '🌅' : '🌙'} {getTransactionShift(t.createdAt)}
                            </span>
                          </td>
                          <td className="font-bold text-success">{formatCurrency(t.finalPrice)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary btn-sm icon-btn" onClick={() => setDetailModalItem(t)} title="Detail Pesanan">🔍</button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary btn-sm icon-btn" onClick={() => setReceiptData(t)} title="Preview Struk">🧾</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table for Mobile HP (< 768px) - 3 Columns */}
                <div className="table-container show-mobile">
                  <table>
                    <thead>
                      <tr>
                        <th>NO</th>
                        <th style={{ textAlign: 'center' }}>Detail</th>
                        <th style={{ textAlign: 'center' }}>Struk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTx.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontSize: '12px', fontWeight: '700', wordBreak: 'break-all' }}>
                            {t.orderNumber || `#${t.id}`}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary btn-sm icon-btn" onClick={() => setDetailModalItem(t)} title="Detail Pesanan">
                              🔍
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary btn-sm icon-btn" onClick={() => setReceiptData(t)} title="Preview Struk">
                              🧾
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination current={txPage} total={txTotalPages} onChange={setTxPage} />
              </>
            )}
          </div>
        </>
      )}

      {/* Detail Pesanan Modal */}
      {detailModalItem && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalItem(null)}
          title={`Detail Pesanan — ${detailModalItem.orderNumber || '#' + detailModalItem.id}`}
        >
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge badge-success" style={{ fontSize: '12px' }}>✓ LUNAS</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {new Date(detailModalItem.createdAt).toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              background: 'var(--bg-tertiary)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
            }}>
              <div>👤 Kasir: <strong>{detailModalItem.user?.name || '-'}</strong></div>
              <div>💳 Metode: <strong>{detailModalItem.paymentMethod || 'Cash'}</strong></div>
              <div>⏱️ Shift: <strong>{getTransactionShift(detailModalItem.createdAt)}</strong></div>
            </div>

            <div>
              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>List Menu Dipesan:</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Menu</th>
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

            <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setDetailModalItem(null)}>Tutup</button>
          </div>
        </Modal>
      )}

      {/* Receipt Modal (Preview Struk) */}
      {receiptData && (
        <div className="modal-overlay" onClick={() => setReceiptData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>🧾 Struk Transaksi</h2>
              <button className="modal-close" onClick={() => setReceiptData(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{
                background: '#fff',
                color: '#000',
                padding: '24px',
                borderRadius: '12px',
                fontFamily: "'Courier New', monospace",
                fontSize: '13px',
                lineHeight: '1.6',
              }}>
                {/* Header with Logo */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <img src="/assets/logo-bw.png" alt="CaptGrill" style={{ width: '140px', height: '80px', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} onError={(e) => { e.target.style.display='none'; }} />
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>CaptGrill</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Jl. Nusantara Gg. Buntu, Timbangan, Kecamatan Indralaya Utara, Kabupaten Ogan Ilir, Sumatera Selatan 30862</div>
                </div>

                <div style={{ borderTop: '2px dashed #ccc', margin: '8px 0' }} />

                {/* Info */}
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>
                  <div>No: {receiptData.orderNumber || `#${receiptData.id}`}</div>
                  <div>Tanggal: {new Date(receiptData.createdAt).toLocaleString('id-ID')}</div>
                  <div>Kasir: {receiptData.user?.name || '-'}</div>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                {/* Items */}
                {receiptData.details?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>{d.menu?.name} x{d.quantity}</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(d.subtotal)}</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(receiptData.totalPrice)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: '#dc2626' }}>
                    <span>Diskon</span>
                    <span>-{formatCurrency(receiptData.discount)}</span>
                  </div>
                )}

                <div style={{ borderTop: '2px dashed #ccc', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: '700', fontSize: '16px' }}>
                  <span>TOTAL</span>
                  <span>{formatCurrency(receiptData.finalPrice)}</span>
                </div>

                {/* Payment Info */}
                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>Bayar via</span>
                  <span style={{ fontWeight: '600' }}>{receiptData.paymentMethod || 'Cash'}</span>
                </div>
                {receiptData.amountPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>Diterima</span>
                    <span>{formatCurrency(receiptData.amountPaid)}</span>
                  </div>
                )}
                {receiptData.amountPaid > receiptData.finalPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: '600', color: '#16a34a' }}>
                    <span>Kembalian</span>
                    <span>{formatCurrency(receiptData.amountPaid - receiptData.finalPrice)}</span>
                  </div>
                )}

                <div style={{ borderTop: '2px dashed #ccc', margin: '8px 0' }} />

                <div style={{ textAlign: 'center', fontSize: '11px', color: '#888', marginTop: '12px' }}>
                  Terima kasih sudah berkunjung! <br />
                  Selamat menikmati CaptGrill! <br />
                  Follow IG: @captgrill.id <br />
                  *Powered by Mahasiswa Sistem Informasi Unsri <br />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨️ Cetak</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setReceiptData(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
