'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

export default function BahanKasirPage() {
  const toast = useToast();
  const [recipes, setRecipes] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🧪 Produksi Bahan</h1>
          <p>Proses pembuatan bahan olahan dari bahan dasar</p>
        </div>
      </div>

      <div className="pos-container">
        {/* Recipe Grid */}
        <div>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '700' }}>📋 Pilih Resep</h3>
          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat resep...</p></div>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧪</div>
              <p>Belum ada resep tersedia</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Hubungi admin untuk menambahkan resep</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => selectRecipe(recipe)}
                  style={{
                    background: 'var(--bg-secondary)',
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
                        <span>{c.ingredient.name}</span>
                        <span>{c.quantity} {c.ingredient.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Production Log */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3>📜 Riwayat Hari Ini</h3>
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

      {/* Confirmation Modal */}
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
                    <span>{c.ingredient.name}</span>
                    <span style={{ fontWeight: '600' }}>-{c.quantity} {c.ingredient.unit}</span>
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
                      <span style={{ color: 'var(--danger)' }}>⬇ {c.ingredient.name}</span>
                      <span style={{ fontWeight: '600', color: 'var(--danger)' }}>-{c.quantity * quantity} {c.ingredient.unit}</span>
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
