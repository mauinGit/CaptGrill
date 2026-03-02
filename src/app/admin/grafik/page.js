'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GrafikPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    const fetchData = async () => {
      // Get last 30 days data
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }

      const from = days[0];
      const to = days[days.length - 1];

      const [incomeRes, expenseRes] = await Promise.all([
        fetch(`/api/transaksi?from=${from}&to=${to}`),
        fetch(`/api/pengeluaran?from=${from}&to=${to}`),
      ]);

      const transactions = await incomeRes.json();
      const expenses = await expenseRes.json();

      const chartData = days.map((day) => {
        const dayIncome = (Array.isArray(transactions) ? transactions : [])
          .filter((t) => t.createdAt?.startsWith(day) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.finalPrice, 0);
        const dayExpense = (Array.isArray(expenses) ? expenses : [])
          .filter((e) => e.date?.startsWith(day))
          .reduce((sum, e) => sum + e.amount, 0);

        return {
          date: new Date(day).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          Pemasukan: dayIncome,
          Pengeluaran: dayExpense,
          Laba: dayIncome - dayExpense,
        };
      });

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat grafik...</p></div>;
  }

  const Chart = chartType === 'bar' ? BarChart : LineChart;

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📈 Grafik Keuangan</h1>
          <p>Visualisasi pemasukan & pengeluaran 30 hari terakhir</p>
        </div>
        <div className="navbar-right">
          <div className="btn-group">
            <button className={`btn ${chartType === 'bar' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setChartType('bar')}>📊 Bar</button>
            <button className={`btn ${chartType === 'line' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setChartType('line')}>📈 Line</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={(v) => `${(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={(v) => `${(v / 1000)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="Pemasukan" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Laba" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
