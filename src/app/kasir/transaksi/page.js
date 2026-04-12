'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import { useBluetooth } from '@/components/BluetoothPrinter';

const PAYMENT_METHODS = ['Cash', 'Grab', 'QRIS', 'Lainnya'];

export default function TransaksiPage() {
  const toast = useToast();
  const bt = useBluetooth();
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => { setMenus(data); setLoading(false); });
  }, []);

  const addToCart = (menu) => {
    const existing = cart.find((c) => c.menuId === menu.id);
    if (existing) {
      setCart(cart.map((c) => c.menuId === menu.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }]);
    }
  };

  const updateQty = (menuId, delta) => {
    setCart(cart.map((c) => {
      if (c.menuId === menuId) {
        const newQty = c.quantity + delta;
        return newQty <= 0 ? null : { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const removeItem = (menuId) => {
    setCart(cart.filter((c) => c.menuId !== menuId));
  };

  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const clampedDiscount = Math.min(discount, totalPrice);
  const finalPrice = totalPrice - clampedDiscount;
  const paidAmount = parseInt(amountPaid) || 0;
  const change = paidAmount - finalPrice;

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Cash' && paidAmount < finalPrice) {
      toast.error('Uang yang diberikan kurang dari total harga');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ menuId: c.menuId, quantity: c.quantity })),
          discount: clampedDiscount,
          amountPaid: paidAmount || finalPrice,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('Transaksi berhasil! 🎉');

        // Auto-print receipt if Bluetooth printer connected
        if (bt?.connected) {
          try {
            await bt.printReceipt({
              orderNumber: result.orderNumber,
              items: cart,
              discount: clampedDiscount,
              totalPrice,
              finalPrice,
              amountPaid: paidAmount || finalPrice,
              paymentMethod,
              change: paymentMethod === 'Cash' ? change : 0,
              transactionDate: new Date().toISOString(),
            });
            toast.success('🖨️ Struk dicetak!');
          } catch (printErr) {
            toast.error('Gagal mencetak: ' + (printErr.message || ''));
          }
        }

        setCart([]);
        setDiscount(0);
        setAmountPaid('');
        setPaymentMethod('Cash');
        setShowConfirm(false);
        // Refresh menu
        const menuRes = await fetch('/api/menu');
        setMenus(await menuRes.json());
      } else {
        const data = await res.json();
        toast.error(data.error || 'Transaksi gagal');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
    setSubmitting(false);
  };

  const filteredMenus = menus.filter((m) => {
    if (filter === '') return true;
    return m.category === filter;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) setShowConfirm(true);
      }
      if (e.key === 'Escape') {
        setShowConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>🛒 Transaksi</h1>
          <p>Pilih menu dan proses pembayaran • <kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>F2</kbd> = Bayar</p>
        </div>
      </div>

      <div className="pos-container">
        {/* Menu Grid */}
        <div>
          <div className="btn-group" style={{ marginBottom: '16px' }}>
            <button className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('')}>Semua</button>
            <button className={`btn ${filter === 'Makanan' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Makanan')}>🍔 Makanan</button>
            <button className={`btn ${filter === 'Minuman' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Minuman')}>🥤 Minuman</button>
            <button className={`btn ${filter === 'Snack' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Snack')}>🍟 Snack</button>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat menu...</p></div>
          ) : (
            <div className="pos-menu-grid">
              {filteredMenus.map((menu) => (
                <div
                  key={menu.id}
                  className="pos-menu-item"
                  onClick={() => addToCart(menu)}
                >
                  {menu.image ? (
                    <div className="pos-menu-img">
                      <img src={menu.image} alt={menu.name} />
                    </div>
                  ) : (
                    <div className="pos-menu-icon">
                      {menu.category === 'Minuman' ? '🥤' : menu.category === 'Snack' ? '🍟' : '🍔'}
                    </div>
                  )}
                  <div className="pos-menu-name">{menu.name}</div>
                  <div className="pos-menu-price">{formatCurrency(menu.price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3>🧾 Pesanan</h3>
            {cart.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setCart([])}>Hapus Semua</button>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <div className="pos-cart-empty-icon">🛒</div>
                <p>Belum ada pesanan</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Klik menu untuk menambahkan</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuId} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <div className="pos-cart-item-name">{item.name}</div>
                    <div className="pos-cart-item-price">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="pos-cart-qty">
                    <button onClick={() => updateQty(item.menuId, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuId, 1)}>+</button>
                  </div>
                  <div style={{ marginLeft: '12px', fontWeight: '700', minWidth: '70px', textAlign: 'right', fontSize: '13px' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="pos-cart-footer">
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Diskon (Rp)</label>
                <input type="number" className="form-input" value={discount || ''} onChange={(e) => {
                  const raw = e.target.value.replace(/^0+(?=\d)/, '');
                  const val = parseInt(raw) || 0;
                  setDiscount(val);
                }} min="0" style={{ marginTop: '4px', padding: '6px 10px', fontSize: '13px' }} />
                {discount > totalPrice && (
                  <small style={{ color: 'var(--danger)', fontSize: '11px' }}>⚠️ Diskon melebihi total, akan di-cap ke {formatCurrency(totalPrice)}</small>
                )}
              </div>
              <div className="pos-cart-total">
                <span>Subtotal</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="pos-cart-total">
                  <span>Diskon</span>
                  <span className="text-danger">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="pos-cart-total" style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontWeight: '700' }}>TOTAL</span>
                <span className="total-value">{formatCurrency(finalPrice)}</span>
              </div>
              <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={submitting}>
                💳 Bayar (F2)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal with Payment */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Konfirmasi Pembayaran</h2>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              {cart.map((item) => (
                <div key={item.menuId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Diskon</span>
                  <span className="text-danger font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', borderBottom: '2px solid var(--border)' }}>
                <span className="font-bold">TOTAL</span>
                <span className="font-bold text-primary">{formatCurrency(finalPrice)}</span>
              </div>

              {/* Payment Method */}
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Metode Pembayaran</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Amount Paid */}
              <div className="form-group">
                <label className="form-label">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  className="form-input"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={finalPrice.toString()}
                  autoFocus
                  style={{ fontSize: '16px', fontWeight: '600' }}
                />
              </div>

              {/* Change */}
              {paymentMethod === 'Cash' && paidAmount >= finalPrice && paidAmount > 0 && (
                <div style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>💰 Kembalian</span>
                  <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(change)}</span>
                </div>
              )}

              {paymentMethod === 'Cash' && paidAmount > 0 && paidAmount < finalPrice && (
                <div style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  textAlign: 'center',
                  color: 'var(--danger)',
                  fontWeight: '600',
                }}>
                  ⚠️ Uang kurang {formatCurrency(finalPrice - paidAmount)}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '⏳ Memproses...' : '✅ Konfirmasi Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
