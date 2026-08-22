'use client';

import { useEffect, useState, Fragment } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

const UNITS = ['pcs', 'gram', 'kg', 'ml', 'liter', 'butir', 'lembar', 'sachet'];

function StockBadge({ stock, minStock }) {
  const s = parseFloat(stock);
  const m = parseFloat(minStock);
  if (s === 0) return <span className="badge badge-danger" style={{ fontSize: '11px' }}>⛔ Habis</span>;
  if (s <= m) return <span className="badge badge-warning" style={{ fontSize: '11px' }}>⚠ Menipis</span>;
  return <span className="badge badge-success" style={{ fontSize: '11px' }}>✓ Aman</span>;
}

function MiniProgressBar({ stock, minStock }) {
  const s = parseFloat(stock);
  const m = parseFloat(minStock);
  const pct = m > 0 ? Math.min(100, Math.round((s / m) * 100)) : 100;
  const color = s === 0 ? 'var(--danger)' : s <= m ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ width: '60px', height: '4px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function BahanPage() {
  const toast = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editModal, setEditModal] = useState(false);
  const [restockModal, setRestockModal] = useState(false);
  const [copyModal, setCopyModal] = useState(false);
  const [actionSheetItem, setActionSheetItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [editForm, setEditForm] = useState({ name: '', unit: '', minStock: '', category: '' });
  const [addForm, setAddForm] = useState({ name: '', unit: 'pcs', stock: '', minStock: '', category: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [restockAmount, setRestockAmount] = useState('');
  const [copyText, setCopyText] = useState('');

  const fetchData = async () => {
    const res = await fetch(`/api/bahan?search=${search}&sort=kategori`);
    const data = await res.json();
    setIngredients(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  // Unique categories (termasuk kategori custom baru)
  const categories = [...new Set([...ingredients.map((i) => i.category).filter(Boolean), ...customCategories])];

  const handleAddNewCategory = () => {
    const name = prompt('Masukkan nama kategori baru:');
    if (!name || !name.trim()) return;
    const newCat = name.trim();
    if (!customCategories.includes(newCat)) {
      setCustomCategories((prev) => [...prev, newCat]);
    }
    setSelectedCat(newCat);
    toast.success(`Kategori "${newCat}" berhasil ditambahkan`);
  };

  // Filtered ingredients by selected category
  const filteredIngredients = selectedCat === 'Semua' 
    ? ingredients 
    : ingredients.filter((i) => (i.category || 'Tanpa Kategori') === selectedCat);

  // Group ingredients by category
  const grouped = filteredIngredients.reduce((acc, item) => {
    const cat = item.category || 'Tanpa Kategori';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const openAdd = () => {
    setSelectedItem(null);
    setAddForm({ name: '', unit: 'pcs', stock: '', minStock: '', category: selectedCat !== 'Semua' ? selectedCat : '' });
    setIsAdding(true);
    setEditModal(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setEditForm({ name: item.name, unit: item.unit, minStock: item.minStock.toString(), category: item.category || '' });
    setIsAdding(false);
    setEditModal(true);
    setActionSheetItem(null);
  };

  const openRestock = (item) => {
    setSelectedItem(item);
    setRestockAmount('');
    setRestockModal(true);
    setActionSheetItem(null);
  };

  const openCopyModal = () => {
    if (ingredients.length === 0) { toast.error('Tidak ada data bahan'); return; }
    const grouped2 = ingredients.reduce((acc, item) => {
      const cat = item.category || 'Tanpa Kategori';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    const lines = Object.entries(grouped2).map(([cat, items]) => {
      const itemLines = items.map((it, idx) => `${idx + 1}. ${it.name} - ${it.stock} ${it.unit}`).join('\n');
      return `${cat}\n${itemLines}`;
    }).join('\n\n');
    setCopyText(lines);
    setCopyModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      toast.success('Catatan berhasil disalin!');
      setCopyModal(false);
    }).catch(() => toast.error('Gagal menyalin'));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (isAdding) {
      const res = await fetch('/api/bahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) { toast.success('Bahan berhasil ditambahkan'); setEditModal(false); fetchData(); }
      else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
    } else {
      const res = await fetch(`/api/bahan/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { toast.success('Data bahan diperbarui'); setEditModal(false); fetchData(); }
      else { const d = await res.json(); toast.error(d.error || 'Gagal'); }
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    const amount = parseFloat(restockAmount);
    if (!amount || amount <= 0) { toast.error('Jumlah harus lebih dari 0'); return; }
    const res = await fetch(`/api/bahan/${selectedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addStock: amount }),
    });
    if (res.ok) { toast.success(`Stok ${selectedItem.name} berhasil diperbarui`); setRestockModal(false); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || 'Gagal restock'); }
  };

  const handleDelete = async (id, name) => {
    setActionSheetItem(null);
    if (!confirm(`Yakin ingin menghapus bahan "${name}"?`)) return;
    const res = await fetch(`/api/bahan/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Bahan berhasil dihapus'); fetchData(); }
    else toast.error('Gagal menghapus bahan');
  };

  const newStockPreview = selectedItem
    ? (parseFloat(selectedItem.stock) + (parseFloat(restockAmount) || 0)).toFixed(2)
    : '0';

  // Render form fields for Add / Edit
  const renderAddEditFields = () => (
    <>
      <div className="form-group">
        <label className="form-label">Nama Bahan *</label>
        <input
          type="text"
          className="form-input"
          value={isAdding ? addForm.name : editForm.name}
          onChange={(e) => isAdding ? setAddForm({ ...addForm, name: e.target.value }) : setEditForm({ ...editForm, name: e.target.value })}
          required
          placeholder="Contoh: Daging Sapi"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <input
            type="text"
            className="form-input"
            list="category-list"
            value={isAdding ? addForm.category : editForm.category}
            onChange={(e) => isAdding ? setAddForm({ ...addForm, category: e.target.value }) : setEditForm({ ...editForm, category: e.target.value })}
            placeholder="Pilih/ketik kategori"
          />
          <datalist id="category-list">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="form-group">
          <label className="form-label">Satuan *</label>
          <select
            className="form-select"
            value={isAdding ? addForm.unit : editForm.unit}
            onChange={(e) => isAdding ? setAddForm({ ...addForm, unit: e.target.value }) : setEditForm({ ...editForm, unit: e.target.value })}
            required
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {isAdding && (
        <div className="form-group">
          <label className="form-label">Stok Awal *</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            value={addForm.stock}
            onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
            required
            placeholder="0"
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Min. Stok (Batas Peringatan) *</label>
        <input
          type="number"
          step="0.01"
          className="form-input"
          value={isAdding ? addForm.minStock : editForm.minStock}
          onChange={(e) => isAdding ? setAddForm({ ...addForm, minStock: e.target.value }) : setEditForm({ ...editForm, minStock: e.target.value })}
          required
          placeholder="5"
        />
        <small style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
          💡 Peringatan &quot;Stok Menipis&quot; akan muncul jika stok di bawah angka ini.
        </small>
      </div>

      {!isAdding && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginTop: '8px',
        }}>
          💡 <strong>Stok tidak diubah di sini.</strong> Untuk menambah stok, gunakan tombol <strong>📦 Restock</strong>.
        </div>
      )}
    </>
  );

  return (
    <div className="animate-fade-in page-container-responsive">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧂 Manajemen Bahan</h1>
          <p>Kelola stok bahan baku CaptGrill</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: '300px', width: '100%' }}>
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
          <button className="btn btn-secondary" onClick={openCopyModal}>📋 Salin Catatan</button>
          <button className="btn btn-primary hide-mobile" onClick={openAdd}>➕ Tambah Bahan</button>
        </div>
      </div>

      {/* Category Filter Chips (Desktop/Tablet >=768px) */}
      <div className="chip-filter-row" style={{ marginBottom: '16px' }}>
        {['Semua', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: selectedCat === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: selectedCat === cat ? 'var(--primary-glow)' : 'var(--bg-card)',
              color: selectedCat === cat ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
        <button
          className="chip-add-new"
          onClick={handleAddNewCategory}
          title="Tambah Kategori Baru"
        >
          + Baru
        </button>
      </div>

      {/* Category Dropdown (Mobile <768px) */}
      <div className="category-dropdown-mobile">
        <select
          className="form-select"
          value={selectedCat}
          onChange={(e) => {
            if (e.target.value === '__ADD_NEW__') {
              handleAddNewCategory();
            } else {
              setSelectedCat(e.target.value);
            }
          }}
          style={{
            width: '100%',
            fontWeight: '600',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <option value="Semua">📁 Semua Kategori ({ingredients.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>📁 {cat}</option>
          ))}
          <option value="__ADD_NEW__" style={{ fontWeight: '700', color: 'var(--primary)' }}>
            ➕ Tambah Kategori Baru...
          </option>
        </select>
      </div>

      {/* Table view for Tablet and Laptop (>=768px) */}
      <div className="card hide-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat data...</p></div>
        ) : ingredients.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📦</div><p>Belum ada data bahan</p></div>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Nama Bahan</th>
                  <th style={{ width: '10%' }}>Satuan</th>
                  <th style={{ width: '22%' }}>Stok</th>
                  <th style={{ width: '12%' }}>Min. Stok</th>
                  <th style={{ width: '14%' }}>Status</th>
                  <th className="col-aksi" style={{ width: '20%', minWidth: '130px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([cat, items]) => (
                  <Fragment key={`grp-${cat}`}>
                    <tr>
                      <td colSpan={6} style={{
                        background: '#fdf8e8',
                        fontWeight: '700',
                        fontSize: '12px',
                        color: '#92720a',
                        padding: '8px 16px',
                        borderBottom: '2px solid #f3e5a0',
                        letterSpacing: '0.5px',
                      }}>
                        📁 {cat}
                      </td>
                    </tr>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.unit}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontWeight: '600',
                              color: parseFloat(item.stock) === 0 ? 'var(--danger)' : parseFloat(item.stock) <= parseFloat(item.minStock) ? 'var(--warning)' : 'var(--text-primary)',
                            }}>
                              {parseFloat(item.stock)}
                            </span>
                            <MiniProgressBar stock={item.stock} minStock={item.minStock} />
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{parseFloat(item.minStock)}</td>
                        <td><StockBadge stock={item.stock} minStock={item.minStock} /></td>
                        <td className="col-aksi" style={{ textAlign: 'center' }}>
                          <div className="btn-group aksi-cell">
                            <button
                              className="btn btn-secondary btn-sm icon-btn"
                              onClick={() => openEdit(item)}
                              title="Edit data bahan"
                            >✏️</button>
                            <button
                              className="btn btn-sm icon-btn"
                              style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(35,114,39,0.2)' }}
                              onClick={() => openRestock(item)}
                              title="Restock / tambah stok"
                            >📦</button>
                            <button
                              className="btn btn-danger btn-sm icon-btn"
                              onClick={() => handleDelete(item.id, item.name)}
                              title="Hapus bahan"
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
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
        ) : ingredients.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📦</div><p>Belum ada data bahan</p></div>
        ) : (
          <div className="mobile-card-list">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={`mob-cat-${cat}`}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#92720a',
                  background: '#fdf8e8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}>
                  📁 {cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {items.map((item) => (
                    <div key={item.id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{item.name}</div>
                        <StockBadge stock={item.stock} minStock={item.minStock} />
                      </div>
                      <div className="mobile-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Stok: <strong>{parseFloat(item.stock)} {item.unit}</strong> (Min: {parseFloat(item.minStock)})</span>
                          <MiniProgressBar stock={item.stock} minStock={item.minStock} />
                        </div>
                      </div>
                      <div className="mobile-card-footer">
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: #{item.id}</span>
                        <button
                          className="btn btn-secondary btn-sm icon-btn-aksi"
                          onClick={() => setActionSheetItem(item)}
                          aria-label="Aksi"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Button for HP (< 768px) */}
      <button className="fab-btn" onClick={openAdd} title="Tambah Bahan">
        +
      </button>

      {/* HP Action Bottom Sheet */}
      {actionSheetItem && (
        <div className="bottom-sheet-overlay" onClick={() => setActionSheetItem(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--text-tertiary)', opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>
              {actionSheetItem.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => openRestock(actionSheetItem)}
                style={{ justifyContent: 'center' }}
              >
                📦 Restock Stok
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => openEdit(actionSheetItem)}
                style={{ justifyContent: 'center' }}
              >
                ✏️ Edit Data Bahan
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(actionSheetItem.id, actionSheetItem.name)}
                style={{ justifyContent: 'center' }}
              >
                🗑️ Hapus Bahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Panel Drawer for Tablet Add (768px - 1023px) OR Full Screen Page for HP Add (< 768px) OR Modal for Laptop Add / Edit */}
      {editModal && isAdding && (
        <>
          {/* Mobile Full Screen Page (< 768px) */}
          <div className="show-mobile">
            <div className="full-screen-page-overlay">
              <div className="full-screen-page-header">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditModal(false)}>← Kembali</button>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tambah Bahan Baru</h3>
                <div style={{ width: '60px' }} />
              </div>
              <div className="full-screen-page-body">
                <form id="add-form-hp" onSubmit={handleEditSubmit}>
                  {renderAddEditFields()}
                </form>
              </div>
              <div className="full-screen-page-footer">
                <button type="submit" form="add-form-hp" className="btn btn-primary w-full" style={{ padding: '12px' }}>
                  Simpan Bahan
                </button>
              </div>
            </div>
          </div>

          {/* Tablet Side Panel Drawer (768px - 1023px) */}
          <div className="show-tablet">
            <div className="side-panel-overlay" onClick={() => setEditModal(false)}>
              <div className="side-panel" onClick={(e) => e.stopPropagation()}>
                <div className="side-panel-header">
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>➕ Tambah Bahan Baru</h3>
                  <button className="modal-close" onClick={() => setEditModal(false)}>✕</button>
                </div>
                <div className="side-panel-body">
                  <form id="add-form-tablet" onSubmit={handleEditSubmit}>
                    {renderAddEditFields()}
                  </form>
                </div>
                <div className="side-panel-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button>
                  <button type="submit" form="add-form-tablet" className="btn btn-primary">Simpan Bahan</button>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Modal Dialog (>= 1024px) */}
          <div className="hide-mobile hide-tablet">
            <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="➕ Tambah Bahan Baru">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  {renderAddEditFields()}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </Modal>
          </div>
        </>
      )}

      {/* Edit Modal (Dialog for all devices per spec 5.7) */}
      {editModal && !isAdding && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="✏️ Edit Data Bahan">
          <form onSubmit={handleEditSubmit}>
            <div className="modal-body">
              {renderAddEditFields()}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Restock Modal */}
      {restockModal && selectedItem && (
        <Modal isOpen={restockModal} onClose={() => setRestockModal(false)} title={`📦 Restock Stok — ${selectedItem.name}`}>
          <form onSubmit={handleRestock}>
            <div className="modal-body">
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Stok Saat Ini</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {parseFloat(selectedItem.stock)} {selectedItem.unit}
                  </div>
                </div>
                <StockBadge stock={selectedItem.stock} minStock={selectedItem.minStock} />
              </div>

              <div className="form-group">
                <label className="form-label">Tambah Stok ({selectedItem.unit}) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>

              {/* Quick Add Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[5, 10, 25, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRestockAmount(val.toString())}
                    style={{ flex: 1 }}
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Real-time Preview */}
              {parseFloat(restockAmount) > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--primary-glow)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(35,114,39,0.2)',
                  fontSize: '13px',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  Stok setelah update: {newStockPreview} {selectedItem.unit}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setRestockModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={!parseFloat(restockAmount)}>
                ✓ Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Copy Note Modal */}
      {copyModal && (
        <Modal isOpen={copyModal} onClose={() => setCopyModal(false)} title="📋 Preview Catatan Bahan">
          <div className="modal-body">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Berikut adalah daftar semua bahan yang dikelompokkan per kategori untuk disalin:
            </p>
            <textarea
              className="form-textarea"
              value={copyText}
              readOnly
              rows={10}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setCopyModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleCopy}>📋 Salin ke Clipboard</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
