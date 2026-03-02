'use client';

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';

export default function MenuPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [menus, setMenus] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: 'Makanan', image: '', compositions: [] });

  const fetchData = async () => {
    const [menuRes, ingRes] = await Promise.all([
      fetch(`/api/menu?search=${search}`),
      fetch('/api/bahan'),
    ]);
    setMenus(await menuRes.json());
    setIngredients(await ingRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', price: '', category: 'Makanan', image: '', compositions: [] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      compositions: item.menuIngredients?.map((mi) => ({
        ingredientId: mi.ingredientId.toString(),
        quantity: mi.quantity.toString(),
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 600;
        const maxH = 400;
        let w = img.width;
        let h = img.height;
        // Scale to fit within maxW x maxH
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setForm((prev) => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/menu/${editItem.id}` : '/api/menu';
    const method = editItem ? 'PUT' : 'POST';

    const payload = {
      name: form.name,
      price: form.price,
      category: form.category,
      image: form.image || null,
      ingredients: form.compositions.filter((c) => c.ingredientId && c.quantity),
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editItem ? 'Menu berhasil diupdate' : 'Menu berhasil ditambahkan');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Menu berhasil dihapus');
      fetchData();
    } else {
      toast.error('Gagal menghapus menu');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🍔 Manajemen Menu</h1>
          <p>Kelola menu dan komposisi bahan</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
            <span className="search-box-icon">🔍</span>
            <input type="text" className="form-input" placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '40px' }} />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Menu</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
        ) : menus.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🍽️</div><p>Belum ada menu</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Foto</th>
                  <th>Nama Menu</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Komposisi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ width: '60px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                          {item.category === 'Minuman' ? '🥤' : item.category === 'Snack' ? '🍟' : '🍔'}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td><span className="badge badge-info">{item.category}</span></td>
                    <td className="font-bold text-primary">{formatCurrency(item.price)}</td>
                    <td style={{ fontSize: '12px', maxWidth: '200px' }}>
                      {item.menuIngredients?.map((mi) => (
                        <span key={mi.id} style={{ display: 'inline-block', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', margin: '2px', fontSize: '11px' }}>
                          {mi.ingredient.name}: {mi.quantity} {mi.ingredient.unit}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Menu' : 'Tambah Menu'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Foto Menu</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '120px',
                    height: '80px',
                    borderRadius: '8px',
                    border: '2px dashed var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--bg-tertiary)',
                    transition: 'var(--transition)',
                  }}
                >
                  {form.image ? (
                    <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center' }}>📷 Klik untuk upload</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Format: JPG, PNG. Maks 5MB.
                  </p>
                  {form.image && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm({ ...form, image: '' })}>
                      ✕ Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Menu</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Contoh: Burger Classic" />
              </div>
              <div className="form-group">
                <label className="form-label">Harga (Rp)</label>
                <input type="number" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="25000" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label className="form-label" style={{ margin: 0 }}>Komposisi Bahan</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addComposition}>➕ Tambah Bahan</button>
              </div>
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
