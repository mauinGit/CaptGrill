'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

const CATEGORIES = ['Bahan', 'Sayur', 'Bumbu', 'Packaging'];
const CATEGORY_COLORS = {
  'Bahan': 'badge-info',
  'Sayur': 'badge-success',
  'Bumbu': 'badge-warning',
  'Packaging': 'badge-secondary',
};

export default function BahanPage() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', unit: '', stock: '', minStock: '', category: '' });
  const [sortMode, setSortMode] = useState('kategori'); // 'kategori' or 'abjad'

  const fetchData = async () => {
    const res = await fetch(`/api/bahan?search=${search}&sort=${sortMode}`);
    const data = await res.json();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search, sortMode]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', unit: '', stock: '', minStock: '', category: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      stock: item.stock.toString(),
      minStock: item.minStock.toString(),
      category: item.category || '',
    });
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

  // Group ingredients by category for visual separation
  let currentCategory = null;

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
          <div className="btn-group" style={{ marginLeft: '12px' }}>
            <button
              className={`btn ${sortMode === 'kategori' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSortMode('kategori')}
            >
              📂 Kategori
            </button>
            <button
              className={`btn ${sortMode === 'abjad' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSortMode('abjad')}
            >
              🔤 Abjad
            </button>
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
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th>Stok</th>
                  <th>Min Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item, i) => {
                  // Show category separator row when sorted by category
                  let showSeparator = false;
                  if (sortMode === 'kategori' && item.category !== currentCategory) {
                    currentCategory = item.category;
                    showSeparator = true;
                  }
                  return (
                    <>
                      {showSeparator && (
                        <tr key={`sep-${item.category || 'none'}`}>
                          <td colSpan={8} style={{
                            background: 'var(--bg-tertiary)',
                            fontWeight: '700',
                            fontSize: '13px',
                            padding: '8px 16px',
                            color: 'var(--text-secondary)',
                            borderBottom: '2px solid var(--border)',
                          }}>
                            {item.category ? `📂 ${item.category}` : '📂 Tanpa Kategori'}
                          </td>
                        </tr>
                      )}
                      <tr key={item.id} className={parseFloat(item.stock) <= parseFloat(item.minStock) ? 'low-stock-row' : ''}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>
                          {item.category ? (
                            <span className={`badge ${CATEGORY_COLORS[item.category] || 'badge-secondary'}`}>
                              {item.category}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td>{item.unit}</td>
                        <td>{item.stock}</td>
                        <td>{item.minStock}</td>
                        <td>
                          {parseFloat(item.stock) <= parseFloat(item.minStock) ? (
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
                    </>
                  );
                })}
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
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Satuan</label>
                <select className="form-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required>
                  <option value="">Pilih satuan</option>
                  <option value="pcs">Pcs</option>
                  <option value="gram">Gram</option>
                  <option value="ml">mL</option>
                </select>
              </div>
            </div>
            <div className="form-row">
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
