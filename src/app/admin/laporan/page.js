'use client';

import { useState } from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

export default function LaporanPage() {
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [exPage, setExPage] = useState(1);

  const fetchReport = async () => {
    setLoading(true);
    const res = await fetch(`/api/laporan?from=${from}&to=${to}`);
    setData(await res.json());
    setTxPage(1);
    setExPage(1);
    setLoading(false);
  };

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
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    const incomeHeader = [['DETAIL PEMASUKAN'], [`Periode: ${formatDate(from)} - ${formatDate(to)}`], [], ['No', 'No Order', 'Tanggal & Waktu', 'Kasir', 'Item', 'Bayar Via', 'Subtotal', 'Diskon', 'Total']];
    const incomeRows = (data.transactions || []).map((t, i) => {
      const items = t.details?.map((d) => `${d.menu?.name} x${d.quantity}`).join(', ') || '-';
      return [i + 1, t.orderNumber || `#${t.id}`, new Date(t.createdAt).toLocaleString('id-ID'), t.user?.name || '-', items, t.paymentMethod || 'Cash', t.totalPrice, t.discount || 0, t.finalPrice];
    });
    const totalIncome = (data.transactions || []).reduce((s, t) => s + t.finalPrice, 0);
    incomeRows.push([], ['', '', '', '', '', '', '', 'TOTAL', totalIncome]);
    const wsIncome = XLSX.utils.aoa_to_sheet([...incomeHeader, ...incomeRows]);
    wsIncome['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
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

  const txTotalPages = data ? Math.ceil((data.transactions?.length || 0) / PAGE_SIZE) : 0;
  const exTotalPages = data ? Math.ceil((data.expenses?.length || 0) / PAGE_SIZE) : 0;
  const paginatedTx = data?.transactions?.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE) || [];
  const paginatedEx = data?.expenses?.slice((exPage - 1) * PAGE_SIZE, exPage * PAGE_SIZE) || [];

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
            <label className="form-label">Dari Tanggal</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
            <label className="form-label">Sampai Tanggal</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
            {loading ? '⏳' : '🔍'} Tampilkan
          </button>
          {data && (
            <button className="btn btn-success" onClick={exportToExcel}>📥 Export Excel</button>
          )}
        </div>
      </div>

      {data && (
        <>
          <div className="summary-grid">
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">💰 Transaksi ({data.transactions?.length})</h3>
              </div>
              {data.transactions?.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>Tidak ada transaksi</p>
              ) : (
                <>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>No Order</th><th>Waktu</th><th>Kasir</th><th>Via</th><th>Total</th><th>Struk</th></tr></thead>
                      <tbody>
                        {paginatedTx.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontSize: '11px', fontWeight: '600' }}>{t.orderNumber || `#${t.id}`}</td>
                            <td style={{ fontSize: '12px' }}>{formatDateTime(t.createdAt)}</td>
                            <td>{t.user?.name}</td>
                            <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{t.paymentMethod || 'Cash'}</span></td>
                            <td className="font-bold text-success">{formatCurrency(t.finalPrice)}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => setReceiptData(t)}>🧾</button>
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

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">💸 Pengeluaran ({data.expenses?.length})</h3>
              </div>
              {data.expenses?.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>Tidak ada pengeluaran</p>
              ) : (
                <>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th></tr></thead>
                      <tbody>
                        {paginatedEx.map((e) => (
                          <tr key={e.id}>
                            <td style={{ fontSize: '12px' }}>{formatDate(e.date)}</td>
                            <td><span className="badge badge-warning">{e.category}</span></td>
                            <td style={{ fontSize: '13px' }}>{e.description}</td>
                            <td className="font-bold text-danger">{formatCurrency(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination current={exPage} total={exTotalPages} onChange={setExPage} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Receipt Modal */}
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
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReceiptData(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
