'use client';

import { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

function getTierMax(rawMax) {
  if (!rawMax || rawMax <= 0) return 1000000; // Default tier terendah = 1 Juta (1.000.000)

  const baseTiers = [1, 2, 3, 5];
  let multiplier = 1000000; // Mulai dari 1 Juta

  while (multiplier <= 100000000000) {
    for (const tier of baseTiers) {
      const candidate = tier * multiplier;
      if (candidate >= rawMax) {
        return candidate;
      }
    }
    multiplier *= 10;
  }
  return 1000000;
}

// Minimal line chart using SVG — tier-scaled Y axis (1M -> 2M -> 3M -> 5M -> 10M ...)
function LineChart({ data, width = 700, height = 190 }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 16, bottom: 36, left: 56 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Auto-scale tier bertingkat dari nilai tertinggi aktual
  const rawMax = Math.max(...data.flatMap((d) => [d.income || 0, d.expense || 0]), 0);
  const maxVal = getTierMax(rawMax);

  const getX = (i) => (i / (data.length - 1)) * chartW;
  const getY = (val) => chartH - ((val || 0) / maxVal) * chartH;

  const toPath = (key) =>
    data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`)
      .join(' ');

  const toArea = (key) =>
    `${toPath(key)} L ${getX(data.length - 1).toFixed(1)} ${chartH} L 0 ${chartH} Z`;

  const formatK = (v) => {
    if (v === 0) return '0';
    if (v >= 1000000) {
      const val = v / 1000000;
      return Number.isInteger(val) ? `${val}jt` : `${val.toFixed(2).replace(/\.?0+$/, '')}jt`;
    }
    if (v >= 1000) {
      const val = v / 1000;
      return Number.isInteger(val) ? `${val}k` : `${val.toFixed(1).replace(/\.?0+$/, '')}k`;
    }
    return v.toString();
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxVal * r));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#237227" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#237227" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Y grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={0} y1={getY(tick)} x2={chartW} y2={getY(tick)}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4"
            />
            <text
              x={-8} y={getY(tick) + 4}
              textAnchor="end" fontSize="11" fill="var(--text-tertiary)"
            >
              {formatK(tick)}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path d={toArea('income')} fill="url(#incomeGrad)" />
        <path d={toArea('expense')} fill="url(#expenseGrad)" />

        {/* Lines */}
        <path d={toPath('income')} fill="none" stroke="#237227" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={toPath('expense')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)} y={chartH + 22}
            textAnchor="middle" fontSize="10" fill="var(--text-tertiary)"
          >
            {d.label}
          </text>
        ))}
      </g>
    </svg>
  );
}

function DeltaBadge({ today, yesterday }) {
  if (yesterday === 0 && today === 0) {
    return <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>— kmrn</span>;
  }
  if (yesterday === 0) {
    return <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>▲ Baru kmrn</span>;
  }
  const delta = ((today - yesterday) / yesterday) * 100;
  const isUp = delta >= 0;
  return (
    <span style={{
      fontSize: '11px',
      color: isUp ? 'var(--success)' : 'var(--danger)',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
    }}>
      {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% kmrn
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <p>Gagal memuat data</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="navbar">
        <div className="navbar-left">
          <h1>📊 Dashboard</h1>
          <p>Selamat datang <span style={{ color: 'var(--primary)' }}>admin</span></p>
        </div>
      </div>

      {/* Stat Cards — 2 kolom sejajar */}
      <div className="two-col-stats" style={{ marginBottom: '24px' }}>
        {/* Transaksi */}
        <div className="summary-card">
          <div className="summary-card-info" style={{ flex: 1 }}>
            <h3>Transaksi</h3>
            <div className="value">{data.todayTransactionCount}</div>
            <div style={{ marginTop: '4px' }}>
              <DeltaBadge today={data.todayTransactionCount} yesterday={data.yesterdayTransactionCount} />
            </div>
          </div>
        </div>

        {/* Pemasukan */}
        <div className="summary-card">
          <div className="summary-card-info" style={{ flex: 1 }}>
            <h3>Pemasukan</h3>
            <div className="value">{formatCurrency(data.todayIncome)}</div>
            <div style={{ marginTop: '4px' }}>
              <DeltaBadge today={data.todayIncome} yesterday={data.yesterdayIncome} />
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Keuangan */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">📈 Grafik Keuangan</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="hide-mobile" style={{ display: 'flex', gap: '12px', marginRight: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                Pemasukan
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '12px', height: '3px', background: 'var(--danger)', borderRadius: '2px', display: 'inline-block' }} />
                Pengeluaran
              </span>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              fontSize: '12px',
              fontWeight: 600,
            }}>2 Minggu</span>
          </div>
        </div>
        <LineChart data={data.chartData} />
      </div>

      {/* Menu Terlaris Hari Ini */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">🏆 Menu Terlaris Hari Ini</h3>
        </div>
        {!data.menuSales || data.menuSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p style={{ fontSize: '14px' }}>Belum ada penjualan hari ini</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.menuSales.map((item, i) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: i === 0
                    ? 'linear-gradient(135deg, rgba(251,217,83,0.12), rgba(251,217,83,0.04))'
                    : 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: i === 0 ? '1px solid rgba(251,217,83,0.3)' : '1px solid var(--border-light)',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '800',
                    background: i === 0 ? '#fbd953' : i === 1 ? '#e2e8f0' : i === 2 ? '#fed7aa' : 'var(--bg-tertiary)',
                    color: i === 0 ? '#92400e' : i < 3 ? '#374151' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {item.category === 'Minuman' ? '🥤' : item.category === 'Snack' ? '🍟' : '🍔'} {item.category}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)' }}>{item.totalQty} porsi</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{formatCurrency(item.totalRevenue)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stok Menipis */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">⚠️ Stok Menipis</h3>
          {data.lowStockItems?.length > 0 && (
            <span className="badge badge-danger">{data.lowStockItems.length} bahan</span>
          )}
        </div>
        {!data.lowStockItems || data.lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <p style={{ fontSize: '14px' }}>Semua stok aman</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
            {data.lowStockItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    {item.status === 'HABIS' ? (
                      <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 8px' }}>⛔ Habis</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 8px' }}>⚠ Menipis</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <span style={{ fontWeight: '700', color: item.status === 'HABIS' ? 'var(--danger)' : 'var(--warning)' }}>
                      {item.stock}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}> / {item.minStock} {item.unit}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: '6px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-tertiary)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.progressPercent}%`,
                    borderRadius: 'var(--radius-full)',
                    background: item.status === 'HABIS' ? 'var(--danger)' : 'var(--warning)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
