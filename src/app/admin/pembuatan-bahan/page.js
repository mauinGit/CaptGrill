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
    if (!form.ingredientId) {
      toast.error('Pilih bahan hasil produksi yang valid dari daftar');
      return;
    }
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

  const renderFormFields = () => (
    <>
      <div className="form-group">
        <label className="form-label">Nama Resep *</label>
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
        <label className="form-label">Bahan Hasil Produksi *</label>
        <input
          type="text"
          className="form-input"
          list="result-ingredients-list"
          placeholder="🔍 Ketik atau pilih bahan hasil..."
          value={
            ingredients.find((i) => i.id.toString() === form.ingredientId)?.name ||
            form.ingredientSearch ||
            ''
          }
          onChange={(e) => {
            const val = e.target.value;
            const ing = ingredients.find(
              (i) => i.name.toLowerCase() === val.toLowerCase()
            );
            setForm((prev) => ({
              ...prev,
              ingredientSearch: val,
              ingredientId: ing ? ing.id.toString() : '',
              name: prev.name || (ing ? ing.name : prev.name),
            }));
          }}
          disabled={!!editItem}
          required
        />
        <datalist id="result-ingredients-list">
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.name}>
              {ing.name} ({ing.unit})
            </option>
          ))}
        </datalist>
        <small style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
          {editItem ? '🔒 Bahan hasil tidak bisa diubah saat edit' : '💡 Ketik nama bahan untuk mencari tanpa perlu scroll panjang'}
        </small>
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
        {form.compositions.map((comp, index) => {
          const currentIng = ingredients.find((i) => i.id.toString() === comp.ingredientId);
          return (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ flex: 2, position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  list={`comp-list-${index}`}
                  placeholder="🔍 Ketik bahan dasar..."
                  value={currentIng?.name || comp.searchName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const ing = ingredients.find(
                      (i) => i.name.toLowerCase() === val.toLowerCase()
                    );
                    updateComposition(index, 'ingredientId', ing ? ing.id.toString() : '');
                    updateComposition(index, 'searchName', val);
                  }}
                  required
                />
                <datalist id={`comp-list-${index}`}>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.name}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </datalist>
              </div>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={comp.quantity}
                onChange={(e) => updateComposition(index, 'quantity', e.target.value)}
                placeholder="Jumlah"
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                className="btn btn-danger btn-sm icon-btn"
                onClick={() => removeComposition(index)}
                title="Hapus bahan dasar"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧪 Pembuatan Bahan</h1>
          <p>Kelola resep pembuatan bahan olahan dari bahan dasar</p>
        </div>
      </div>

      {/* Toolbar */}
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
          <button className="btn btn-primary hide-mobile" onClick={openAdd}>➕ Tambah Resep</button>
        </div>
      </div>

      {/* Table view for Tablet & Laptop (>= 768px) */}
      <div className="card hide-mobile">
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
                  <th>Nama Resep</th>
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
                          {c.ingredient?.name}: {c.quantity} {c.ingredient?.unit}
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

      {/* Card list view for HP (< 768px) */}
      <div className="show-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
        ) : recipes.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🧪</div><p>Belum ada resep pembuatan bahan</p></div>
        ) : (
          <div className="mobile-card-list">
            {recipes.map((item) => (
              <div key={item.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-title">{item.name}</div>
                  <span className="badge badge-success" style={{ fontSize: '11px' }}>
                    → {item.ingredient?.name}
                  </span>
                </div>
                <div className="mobile-card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {item.compositions?.map((c) => (
                      <span key={c.id} style={{ background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {c.ingredient?.name}: {c.quantity} {c.ingredient?.unit}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mobile-card-footer">
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Hasil: {item.ingredient?.unit}</span>
                  <div className="btn-group">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️ Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Button for HP (< 768px) */}
      <button className="fab-btn" onClick={openAdd} title="Tambah Resep">
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
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tambah Resep Baru</h3>
                <div style={{ width: '60px' }} />
              </div>
              <div className="full-screen-page-body">
                <form id="recipe-form-hp" onSubmit={handleSubmit}>
                  {renderFormFields()}
                </form>
              </div>
              <div className="full-screen-page-footer">
                <button type="submit" form="recipe-form-hp" className="btn btn-primary w-full" style={{ padding: '12px' }}>
                  Simpan Resep
                </button>
              </div>
            </div>
          </div>

          {/* Tablet Side Panel Drawer (768px - 1023px) */}
          <div className="show-tablet">
            <div className="side-panel-overlay" onClick={() => setModalOpen(false)}>
              <div className="side-panel" onClick={(e) => e.stopPropagation()}>
                <div className="side-panel-header">
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>➕ Tambah Resep Baru</h3>
                  <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                </div>
                <div className="side-panel-body">
                  <form id="recipe-form-tablet" onSubmit={handleSubmit}>
                    {renderFormFields()}
                  </form>
                </div>
                <div className="side-panel-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                  <button type="submit" form="recipe-form-tablet" className="btn btn-primary">Simpan Resep</button>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Modal Dialog (>= 1024px) */}
          <div className="hide-mobile hide-tablet">
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="➕ Tambah Resep Baru" size="lg">
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
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="✏️ Edit Resep" size="lg">
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
