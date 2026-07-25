'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DataGrid from '@/components/DataGrid';
import { formatCurrency } from '@/lib/utils';

const TABS = [
  { key: 'transaksi', icon: '💰', label: 'Transaksi' },
  { key: 'pengeluaran', icon: '💸', label: 'Pengeluaran' },
  { key: 'absensi', icon: '📅', label: 'Absensi' },
  { key: 'gaji', icon: '💰', label: 'Gaji' },
];

const PAYMENT_ICONS = { Cash: '💵', Grab: '🟢', QRIS: '📱', GoFood: '🟠' };

// Column definitions for each tab
const TRANSAKSI_COLUMNS = [
  { key: 'orderNumber', label: 'No Order', width: 150, type: 'text' },
  { key: 'createdAt', label: 'Waktu', width: 180, type: 'datetime' },
  { key: 'kasir', label: 'Kasir', width: 120, type: 'text' },
  { key: 'items', label: 'Item', width: 280, type: 'text' },
  { key: 'paymentMethod', label: 'Via', width: 90, type: 'badge', badgeClass: () => 'badge-info' },
  { key: 'shift', label: 'Shift', width: 100, type: 'badge', badgeClass: (val) => val === 'Shift 1' ? 'badge-warning' : 'badge-info' },
  { key: 'totalPrice', label: 'Subtotal', width: 130, type: 'currency' },
  { key: 'discount', label: 'Diskon', width: 100, type: 'currency' },
  { key: 'finalPrice', label: 'Total', width: 140, type: 'currency' },
];

const PENGELUARAN_COLUMNS = [
  { key: 'date', label: 'Tanggal', width: 150, type: 'date' },
  { key: 'category', label: 'Kategori', width: 160, type: 'badge', badgeClass: () => 'badge-warning' },
  { key: 'description', label: 'Deskripsi', width: 300, type: 'text' },
  { key: 'amount', label: 'Nominal', width: 150, type: 'currency' },
];

const ABSENSI_COLUMNS = [
  { key: 'name', label: 'Nama', width: 150, type: 'text' },
  { key: 'date', label: 'Tanggal', width: 150, type: 'date' },
  { key: 'clockIn', label: 'Jam Masuk', width: 130, type: 'datetime',
    format: (val) => new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  },
  { key: 'purpose', label: 'Tujuan', width: 140, type: 'badge',
    badgeClass: (val) => val === 'Membuat Bahan' ? 'badge-warning' : 'badge-info'
  },
  { key: 'hasPhoto', label: 'Foto', width: 80, type: 'text',
    format: (val) => val ? '📸 Ada' : '-'
  },
  { key: 'hasLocation', label: 'Lokasi', width: 100, type: 'text',
    format: (val) => val ? '✅ Valid' : '⚠️ N/A'
  },
];

const GAJI_COLUMNS = [
  { key: 'name', label: 'Nama', width: 150, type: 'text' },
  { key: 'period', label: 'Periode', width: 120, type: 'text' },
  { key: 'shiftDays', label: 'Hari Shift', width: 100, type: 'number' },
  { key: 'shiftRate', label: 'Rate Shift', width: 130, type: 'currency' },
  { key: 'gajiShift', label: 'Gaji Shift', width: 140, type: 'currency' },
  { key: 'produksiDays', label: 'Kali Produksi', width: 110, type: 'number' },
  { key: 'produksiRate', label: 'Rate Produksi', width: 130, type: 'currency' },
  { key: 'gajiProduksi', label: 'Gaji Produksi', width: 140, type: 'currency' },
  { key: 'totalSalary', label: 'Total Gaji', width: 150, type: 'currency' },
];

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function LaporanPage() {
  // Date range: default to today
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('transaksi');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Fetch data
  const fetchData = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/live-data?from=${from}&to=${to}&tab=all`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [from, to]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [from, to]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  // Get data & columns for current tab
  const getTabData = () => {
    if (!data) return { items: [], columns: [] };

    switch (activeTab) {
      case 'transaksi':
        return { items: data.transactions || [], columns: TRANSAKSI_COLUMNS };
      case 'pengeluaran':
        return { items: data.expenses || [], columns: PENGELUARAN_COLUMNS };
      case 'absensi':
        return { items: data.attendances || [], columns: ABSENSI_COLUMNS };
      case 'gaji':
        return { items: data.salaries || [], columns: GAJI_COLUMNS };
      default:
        return { items: [], columns: [] };
    }
  };

  const { items, columns } = getTabData();

  // Tab counts
  const getTabCount = (key) => {
    if (!data) return 0;
    switch (key) {
      case 'transaksi': return data.transactions?.length || 0;
      case 'pengeluaran': return data.expenses?.length || 0;
      case 'absensi': return data.attendances?.length || 0;
      case 'gaji': return data.salaries?.length || 0;
      default: return 0;
    }
  };

  // Export filename
  const getExportFilename = () => {
    const tabLabel = TABS.find((t) => t.key === activeTab)?.label || 'Data';
    return `CaptGrill_${tabLabel}_${from}_sd_${to}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Navbar */}
      <div className="navbar">
        <div className="navbar-left">
          <h1>📊 Live Data — Spreadsheet</h1>
          <p>Data real-time dalam bentuk spreadsheet interaktif</p>
        </div>
      </div>

      {/* Date Range & Controls */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
            <label className="form-label">Dari Tanggal</label>
            <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
            <label className="form-label">Sampai Tanggal</label>
            <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => fetchData()} disabled={loading}>
            {loading ? '⏳' : '🔍'} Tampilkan
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="livedata-summary" style={{ borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div className="livedata-summary-card">
              <span className="livedata-summary-icon">💰</span>
              <div className="livedata-summary-info">
                <h4>Total Pemasukan</h4>
                <div className="livedata-value green">
                  {formatCurrency(data.transactionSummary?.totalIncome || 0)}
                </div>
              </div>
            </div>
            <div className="livedata-summary-card">
              <span className="livedata-summary-icon">💸</span>
              <div className="livedata-summary-info">
                <h4>Total Pengeluaran</h4>
                <div className="livedata-value red">
                  {formatCurrency(data.expenseSummary?.totalExpense || 0)}
                </div>
              </div>
            </div>
            <div className="livedata-summary-card">
              <span className="livedata-summary-icon">{(data.profit || 0) >= 0 ? '📈' : '📉'}</span>
              <div className="livedata-summary-info">
                <h4>Laba / Rugi</h4>
                <div className={`livedata-value ${(data.profit || 0) >= 0 ? 'green' : 'red'}`}>
                  {formatCurrency(data.profit || 0)}
                </div>
              </div>
            </div>

            {/* Payment method breakdown */}
            {data.transactionSummary?.paymentBreakdown &&
              Object.entries(data.transactionSummary.paymentBreakdown)
                .filter(([, amount]) => amount > 0)
                .map(([method, amount]) => (
                  <div className="livedata-summary-card" key={method}>
                    <span className="livedata-summary-icon">{PAYMENT_ICONS[method] || '💳'}</span>
                    <div className="livedata-summary-info">
                      <h4>{method}</h4>
                      <div className="livedata-value">{formatCurrency(amount)}</div>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Sheet Tabs */}
          <div className="datagrid-sheet-tabs" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`datagrid-sheet-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="datagrid-sheet-tab-icon">{tab.icon}</span>
                {tab.label}
                <span className="datagrid-sheet-tab-count">{getTabCount(tab.key)}</span>
              </button>
            ))}
          </div>

          {/* Refresh Indicator */}
          <div className="datagrid-refresh-bar">
            <div className={`datagrid-refresh-dot ${!autoRefresh ? '' : ''}`} style={{ background: autoRefresh ? 'var(--success)' : 'var(--text-tertiary)', animation: autoRefresh ? undefined : 'none' }} />
            <span>
              {autoRefresh ? 'Live' : 'Dijeda'} • Terakhir diperbarui: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}
              {isRefreshing && <span style={{ marginLeft: '8px', color: 'var(--primary)' }}>Memperbarui...</span>}
            </span>
            <button
              className="datagrid-refresh-btn"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Jeda auto-refresh' : 'Aktifkan auto-refresh'}
            >
              {autoRefresh ? '⏸️ Jeda' : '▶️ Live'}
            </button>
            <button
              className="datagrid-refresh-btn"
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              title="Refresh sekarang"
            >
              <span className={isRefreshing ? 'datagrid-refresh-spin' : ''}>🔄</span> Refresh
            </button>
          </div>

          {/* DataGrid */}
          <DataGrid
            columns={columns}
            data={items}
            title={TABS.find((t) => t.key === activeTab)?.label || 'Data'}
            icon={TABS.find((t) => t.key === activeTab)?.icon || '📊'}
            exportFilename={getExportFilename()}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
