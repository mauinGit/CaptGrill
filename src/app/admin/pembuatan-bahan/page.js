'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function PembuatanBahanPage() {
  const toast = useToast();
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', ingredientId: '', compositions: [] });

  const fetchData = async () => {
    const [recipeRes, ingRes] = await Promise.all([
      fetch(`/api/resep?search=${search}`),
      fetch('/api/bahan'),
    ]);
    setRecipes(await recipeRes.json());
    setIngredients(await ingRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', ingredientId: '', compositions: [] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      ingredientId: item.ingredientId.toString(),
      compositions: item.compositions?.map((c) => ({
        ingredientId: c.ingredientId.toString(),
        quantity: c.quantity.toString(),
      })) || [],
    });
    setModalOpen(true);
  };

  const addComposition = () => {
    setForm({ ...form, compositions: [...form.compositions, { ingredientId: '', quantity: '' }] });
  };

  const removeComposition = (index) => {
    setForm({ ...form, compositions: form.compositions.filter((_, i) => i !== index) });
  };

  const updateComposition = (index, field, value) => {
    const updated = [...form.compositions];
    updated[index][field] = value;
    setForm({ ...form, compositions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/resep/${editItem.id}` : '/api/resep';
    const method = editItem ? 'PUT' : 'POST';

    const payload = {
      name: form.name,
      ingredientId: form.ingredientId,
      compositions: form.compositions.filter((c) => c.ingredientId && c.quantity),
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editItem ? 'Resep berhasil diupdate' : 'Resep berhasil ditambahkan');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus resep ini?')) return;
    const res = await fetch(`/api/resep/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Resep berhasil dihapus');
      fetchData();
    } else {
      toast.error('Gagal menghapus resep');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧪 Pembuatan Bahan</h1>
          <p>Kelola resep pembuatan bahan olahan dari bahan dasar</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Cari resep..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Resep</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
        ) : recipes.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🧪</div><p>Belum ada resep pembuatan bahan</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Bahan</th>
                  <th>Bahan Hasil</th>
                  <th>Komposisi Bahan Dasar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td>
                      <span className="badge badge-success">
                        {item.ingredient?.name} ({item.ingredient?.unit})
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', maxWidth: '300px' }}>
                      {item.compositions?.map((c) => (
                        <span key={c.id} style={{ display: 'inline-block', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', margin: '2px', fontSize: '11px' }}>
                          {c.ingredient.name}: {c.quantity} {c.ingredient.unit}
                        </span>
                      ))}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Resep' : 'Tambah Resep'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nama Resep</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Contoh: Patty"
              />
              <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Nama untuk mengidentifikasi resep ini</small>
            </div>

            <div className="form-group">
              <label className="form-label">Bahan Hasil Produksi</label>
              <select
                className="form-select"
                value={form.ingredientId}
                onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}
                required
              >
                <option value="">Pilih bahan hasil</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Bahan yang dihasilkan dari resep ini (sudah terdaftar di Manajemen Bahan)</small>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label className="form-label" style={{ margin: 0 }}>Komposisi Bahan Dasar</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addComposition}>➕ Tambah Bahan</button>
              </div>
              {form.compositions.length === 0 && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  Belum ada komposisi. Klik &quot;Tambah Bahan&quot; untuk menambahkan bahan dasar.
                </p>
              )}
              {form.compositions.map((comp, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select className="form-select" value={comp.ingredientId} onChange={(e) => updateComposition(index, 'ingredientId', e.target.value)} style={{ flex: 2 }}>
                    <option value="">Pilih bahan</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                  <input type="number" step="0.1" className="form-input" value={comp.quantity} onChange={(e) => updateComposition(index, 'quantity', e.target.value)} placeholder="Jumlah" style={{ flex: 1 }} />
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeComposition(index)}>✕</button>
                </div>
              ))}
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
