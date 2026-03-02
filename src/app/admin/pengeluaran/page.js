'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

const CATEGORIES = ['Pembelian bahan', 'Peralatan', 'Listrik', 'Gaji Karyawan', 'Lainnya'];

export default function PengeluaranPage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [form, setForm] = useState({ category: '', description: '', amount: '', date: '' });

  const fetchData = async () => {
    let url = '/api/pengeluaran';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (params.toString()) url += '?' + params.toString();

    const res = await fetch(url);
    setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [from, to]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ category: 'Pembelian bahan', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      category: item.category,
      description: item.description,
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/pengeluaran/${editItem.id}` : '/api/pengeluaran';
    const method = editItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? 'Pengeluaran diupdate' : 'Pengeluaran ditambahkan');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus?')) return;
    const res = await fetch(`/api/pengeluaran/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Dihapus'); fetchData(); } else toast.error('Gagal menghapus');
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>💸 Manajemen Pengeluaran</h1>
          <p>Catat semua pengeluaran operasional</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: '8px' }}>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: '160px' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: '160px' }} />
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>➕ Tambah</button>
        </div>
      </div>



      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada pengeluaran</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>No</th><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {expenses.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>{formatDate(item.date)}</td>
                    <td><span className="badge badge-warning">{item.category}</span></td>
                    <td>{item.description || '-'}</td>
                    <td className="font-bold text-danger">{formatCurrency(item.amount)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <input type="text" className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nominal (Rp)</label>
                <input type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="50000" />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
