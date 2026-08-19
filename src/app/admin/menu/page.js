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
  const [filterCat, setFilterCat] = useState('Semua');
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

  const filteredMenus = filterCat === 'Semua' ? menus : menus.filter((m) => m.category === filterCat);

  const renderFormFields = () => (
    <>
      {/* Image Upload */}
      <div className="form-group">
        <label className="form-label">Foto Menu</label>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100px',
              height: '100px',
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
              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', textAlign: 'center' }}>📷 Upload</span>
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
              Format: JPG, PNG. Maks 5MB. Rasio 1:1 disarankan.
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
          <label className="form-label">Nama Menu *</label>
          <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Burger Classic" />
        </div>
        <div className="form-group">
          <label className="form-label">Harga (Rp) *</label>
          <input type="number" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="25000" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Kategori *</label>
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
        {form.compositions.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            Belum ada komposisi bahan.
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
            <input type="number" step="0.01" className="form-input" value={comp.quantity} onChange={(e) => updateComposition(index, 'quantity', e.target.value)} placeholder="Jumlah" style={{ flex: 1 }} />
            <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeComposition(index)}>✕</button>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🍔 Manajemen Menu</h1>
          <p>Kelola menu dan komposisi bahan</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
            <span className="search-box-icon">🔍</span>
            <input type="text" className="form-input" placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '40px' }} />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary hide-mobile" onClick={openAdd}>➕ Tambah Menu</button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['Semua', 'Makanan', 'Minuman', 'Snack'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filterCat === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: filterCat === cat ? 'var(--primary-glow)' : 'var(--bg-card)',
              color: filterCat === cat ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {cat === 'Makanan' ? '🍔 Makanan' : cat === 'Minuman' ? '🥤 Minuman' : cat === 'Snack' ? '🍟 Snack' : 'Semua'}
          </button>
        ))}
      </div>

      {/* Grid Kartu Menu: 2 Kolom di HP, 3 Kolom di Tablet & Laptop */}
      {loading ? (
        <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
      ) : filteredMenus.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🍽️</div><p>Belum ada menu</p></div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {filteredMenus.map((item) => {
            const isAvailable = item.isStockSufficient !== false;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {/* Image / Icon container */}
                <div style={{ height: '140px', background: 'var(--bg-tertiary)', position: 'relative', overflow: 'hidden' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      {item.category === 'Minuman' ? '🥤' : item.category === 'Snack' ? '🍟' : '🍔'}
                    </div>
                  )}

                  {/* Stock Availability Badge on top right */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    {isAvailable ? (
                      <span className="badge badge-success" style={{ fontSize: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>✓ Tersedia</span>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>⛔ Stok Habis</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>{item.category}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>{formatCurrency(item.price)}</div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {item.menuIngredients?.length || 0} bahan komposisi
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(item)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB Button for HP (< 768px) */}
      <button className="fab-btn" onClick={openAdd} title="Tambah Menu">
        +
      </button>

      {/* Forms rendering per device strategy */}
      {modalOpen && !editItem && (
        <>
          {/* HP Full Screen Page (< 768px) */}
          <div className="show-mobile">
            <div className="full-screen-page-overlay">
              <div className="full-screen-page-header">
                <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>← Kembali</button>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tambah Menu Baru</h3>
                <div style={{ width: '60px' }} />
              </div>
              <div className="full-screen-page-body">
                <form id="menu-form-hp" onSubmit={handleSubmit}>
                  {renderFormFields()}
                </form>
              </div>
              <div className="full-screen-page-footer">
                <button type="submit" form="menu-form-hp" className="btn btn-primary w-full" style={{ padding: '12px' }}>
                  Simpan Menu
                </button>
              </div>
            </div>
          </div>

          {/* Tablet Side Panel Drawer (768px - 1023px) */}
          <div className="show-tablet">
            <div className="side-panel-overlay" onClick={() => setModalOpen(false)}>
              <div className="side-panel" onClick={(e) => e.stopPropagation()}>
                <div className="side-panel-header">
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>➕ Tambah Menu Baru</h3>
                  <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                </div>
                <div className="side-panel-body">
                  <form id="menu-form-tablet" onSubmit={handleSubmit}>
                    {renderFormFields()}
                  </form>
                </div>
                <div className="side-panel-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                  <button type="submit" form="menu-form-tablet" className="btn btn-primary">Simpan Menu</button>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Modal Dialog (>= 1024px) */}
          <div className="hide-mobile hide-tablet">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="➕ Tambah Menu Baru" size="lg">
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {renderFormFields()}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </Modal>
          </div>
        </>
      )}

      {/* Edit Modal (Dialog for all devices) */}
      {modalOpen && editItem && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="✏️ Edit Menu" size="lg">
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {renderFormFields()}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Update</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
