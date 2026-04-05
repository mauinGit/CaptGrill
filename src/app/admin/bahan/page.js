'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function BahanPage() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', unit: '', stock: '', minStock: '' });

  const fetchData = async () => {
    const res = await fetch(`/api/bahan?search=${search}`);
    const data = await res.json();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', unit: '', stock: '', minStock: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, unit: item.unit, stock: item.stock.toString(), minStock: item.minStock.toString() });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/bahan/${editItem.id}` : '/api/bahan';
    const method = editItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editItem ? 'Bahan berhasil diupdate' : 'Bahan berhasil ditambahkan');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus bahan ini?')) return;
    const res = await fetch(`/api/bahan/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Bahan berhasil dihapus');
      fetchData();
    } else {
      toast.error('Gagal menghapus bahan');
    }
  };

  const handleCopyNotes = () => {
    if (ingredients.length === 0) {
      toast.error('Tidak ada data bahan untuk disalin');
      return;
    }
    const text = ingredients
      .map((item, i) => `${i + 1}.${item.name}: ${item.stock} (${item.unit})`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Catatan bahan berhasil disalin!');
    }).catch(() => {
      toast.error('Gagal menyalin catatan');
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧂 Manajemen Bahan</h1>
          <p>Kelola stok bahan baku CaptGrill</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Cari bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={handleCopyNotes}>📋 Salin Catatan</button>
          <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Bahan</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
        ) : ingredients.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📦</div><p>Belum ada data bahan</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Bahan</th>
                  <th>Satuan</th>
                  <th>Stok</th>
                  <th>Min Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, i) => (
                  <tr key={item.id} className={item.stock <= item.minStock ? 'low-stock-row' : ''}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td>{item.unit}</td>
                    <td>{item.stock}</td>
                    <td>{item.minStock}</td>
                    <td>
                      {item.stock <= item.minStock ? (
                        <span className="badge badge-danger">⚠️ Stok Rendah</span>
                      ) : (
                        <span className="badge badge-success">✅ Aman</span>
                      )}
                    </td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Bahan' : 'Tambah Bahan'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nama Bahan</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Contoh: Roti Burger"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Satuan</label>
                <select className="form-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required>
                  <option value="">Pilih satuan</option>
                  <option value="pcs">Pcs</option>
                  <option value="gram">Gram</option>
                  <option value="ml">mL</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Stok Saat Ini</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Stok Minimum (Alert)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                placeholder="0"
              />
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
