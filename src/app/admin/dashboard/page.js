'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

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
    return <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat dashboard...</p></div>;
  }

  if (!data) {
    return <div className="empty-state"><div className="empty-state-icon">❌</div><p>Gagal memuat data</p></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>Dashboard</h1>
          <p>Selamat datang di CaptGrill Management</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-icon orange">🛒</div>
          <div className="summary-card-info">
            <h3>Transaksi Hari Ini</h3>
            <div className="value">{data.todayTransactionCount}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon green">💰</div>
          <div className="summary-card-info">
            <h3>Pemasukan Hari Ini</h3>
            <div className="value">{formatCurrency(data.todayIncome)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon red">⚠️</div>
          <div className="summary-card-info">
            <h3>Stok Menipis</h3>
            <div className="value">{data.lowStockCount} bahan</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon blue">🍔</div>
          <div className="summary-card-info">
            <h3>Menu Tersedia</h3>
            <div className="value">{data.availableMenus}/{data.totalMenus}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Monthly Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Bulan Ini</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pemasukan</span>
              <span className="text-success font-bold">{formatCurrency(data.monthIncome)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pengeluaran</span>
              <span className="text-danger font-bold">{formatCurrency(data.monthExpense)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Laba / Rugi</span>
              <span style={{ fontWeight: '800', fontSize: '18px', color: data.monthProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(data.monthProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠️ Stok Menipis</h3>
          </div>
          {data.lowStockItems?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
              <p>✅ Semua stok aman</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.lowStockItems?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--danger-bg)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{item.name}</span>
                  <span style={{ color: 'var(--danger)' }}>
                    {item.stock} / {item.minStock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
