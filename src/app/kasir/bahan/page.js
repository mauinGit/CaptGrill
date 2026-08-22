'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

export default function BahanKasirPage() {
  const toast = useToast();
  const [recipes, setRecipes] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMobileLogs, setShowMobileLogs] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    const [recipeRes, logRes] = await Promise.all([
      fetch('/api/resep'),
      fetch(`/api/produksi-bahan?date=${today}`),
    ]);
    const recipeData = await recipeRes.json();
    const logData = await logRes.json();
    setRecipes(Array.isArray(recipeData) ? recipeData : []);
    setProductionLogs(Array.isArray(logData) ? logData : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const selectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setQuantity(1);
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (!selectedRecipe || quantity <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/produksi-bahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          quantity,
        }),
      });

      if (res.ok) {
        toast.success(`Berhasil memproduksi ${selectedRecipe.name} x${quantity}! 🎉`);
        setShowConfirm(false);
        setSelectedRecipe(null);
        setQuantity(1);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal memproses produksi');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
    setSubmitting(false);
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.targetIngredient?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧪 Produksi Bahan</h1>
          <p>Proses pembuatan bahan olahan dari bahan dasar</p>
        </div>
      </div>

      {/* Mobile top link for production logs */}
      <div className="show-mobile" style={{ marginBottom: '12px' }}>
        <button
          className="btn btn-secondary w-full"
          onClick={() => setShowMobileLogs(true)}
          style={{ justifyContent: 'space-between', padding: '10px 16px' }}
        >
          <span>📋 Riwayat Produksi Hari Ini</span>
          <span className="badge badge-info">{productionLogs.length} item</span>
        </button>
      </div>

      <div className="pos-container">
        {/* Recipe Grid Column */}
        <div>
          {/* Real-time Search Bar for Recipes - Insides Recipe Column */}
          <div className="search-bahan-box" style={{ marginBottom: '14px' }}>
            <div className="search-box" style={{ width: '100%', maxWidth: '100%' }}>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Cari bahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat resep...</p></div>
          ) : filteredRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧪</div>
              <p>{searchQuery ? 'Resep tidak ditemukan' : 'Belum ada resep tersedia'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {searchQuery ? 'Coba kata kunci lain' : 'Hubungi admin untuk menambahkan resep'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => selectRecipe(recipe)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                  className="pos-menu-item"
                >
                  <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '8px' }}>🧪</div>
                  <div style={{ fontWeight: '700', textAlign: 'center', marginBottom: '6px', fontSize: '14px' }}>
                    {recipe.name}
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-success" style={{ fontSize: '11px' }}>
                      → {recipe.ingredient?.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {recipe.compositions?.map((c) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>{c.ingredient?.name}</span>
                        <span>{c.quantity} {c.ingredient?.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Production Log for Tablet & Laptop (>= 768px) */}
        <div className="pos-cart pos-cart-desktop hide-mobile">
          <div className="pos-cart-header">
            <h3>📜 Riwayat Produksi Hari Ini</h3>
          </div>

          <div className="pos-cart-items">
            {productionLogs.length === 0 ? (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon">📋</div>
                <p>Belum ada produksi hari ini</p>
              </div>
            ) : (
              productionLogs.map((log) => (
                <div key={log.id} className="pos-cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>
                      🧪 {log.recipe?.name} x{log.quantity}
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>
                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Oleh: {log.user?.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'pre-line' }}>
                    {log.detail}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile Production Log Bottom Sheet */}
      {showMobileLogs && (
        <div className="bottom-sheet-overlay" onClick={() => setShowMobileLogs(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--text-tertiary)', opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
              📋 Riwayat Produksi Hari Ini
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productionLogs.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>Belum ada produksi hari ini</p>
              ) : (
                productionLogs.map((log) => (
                  <div key={log.id} style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                      <span>🧪 {log.recipe?.name} x{log.quantity}</span>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>
                        {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Oleh: {log.user?.name}</div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-secondary w-full" style={{ marginTop: '16px' }} onClick={() => setShowMobileLogs(false)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal / Bottom Sheet */}
      {showConfirm && selectedRecipe && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧪 Konfirmasi Produksi</h2>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧪</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedRecipe.name}</h3>
                <span className="badge badge-success" style={{ marginTop: '8px', display: 'inline-block' }}>
                  → {selectedRecipe.ingredient?.name}
                </span>
              </div>

              {/* Composition detail */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>📦 Bahan yang digunakan per produksi:</p>
                {selectedRecipe.compositions?.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                    <span>{c.ingredient?.name}</span>
                    <span style={{ fontWeight: '600' }}>-{c.quantity} {c.ingredient?.unit}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
                  <span>Hasil: {selectedRecipe.ingredient?.name}</span>
                  <span>+1 {selectedRecipe.ingredient?.unit}</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="form-group">
                <label className="form-label">Jumlah Produksi</label>
                <input
                  type="number"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  autoFocus
                  style={{ fontSize: '18px', fontWeight: '700', textAlign: 'center' }}
                />
              </div>

              {/* Summary */}
              {quantity > 0 && (
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>📊 Ringkasan (x{quantity}):</p>
                  {selectedRecipe.compositions?.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px' }}>
                      <span style={{ color: 'var(--danger)' }}>⬇ {c.ingredient?.name}</span>
                      <span style={{ fontWeight: '600', color: 'var(--danger)' }}>-{c.quantity * quantity} {c.ingredient?.unit}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>
                    <span>⬆ {selectedRecipe.ingredient?.name}</span>
                    <span>+{quantity} {selectedRecipe.ingredient?.unit}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '⏳ Memproses...' : '✅ Proses Produksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
