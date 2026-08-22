'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { formatCurrency } from '@/lib/utils';
import { useBluetooth } from '@/components/BluetoothPrinter';
import { calcCartTotal, calcFinalTotal, calcKembalian, canConfirmPayment } from '@/lib/logic/cart';

const PAYMENT_METHODS = ['Cash', 'QRIS', 'Grab', 'GoFood'];

export default function TransaksiPage() {
  const toast = useToast();
  const bt = useBluetooth();
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('Makanan');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [successState, setSuccessState] = useState(null);

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

  const totalPrice = calcCartTotal(cart.map((c) => ({ price: c.price, qty: c.quantity })));
  const finalPrice = calcFinalTotal(totalPrice, discount);
  const paidAmount = parseInt(amountPaid) || 0;
  const change = calcKembalian(paidAmount, finalPrice, paymentMethod);

  // Validation logic using tested canConfirmPayment
  const canConfirm = cart.length > 0 && canConfirmPayment({ metodePembayaran: paymentMethod, uangDibayar: paidAmount, totalAkhir: finalPrice }) && !submitting;

  const handleSubmit = async () => {
    if (!canConfirm) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ menuId: c.menuId, quantity: c.quantity })),
          discount: totalPrice - finalPrice,
          amountPaid: paymentMethod !== 'Cash' ? finalPrice : paidAmount,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('Transaksi berhasil! 🎉');

        const successData = {
          orderNumber: result.orderNumber || `#${result.id}`,
          items: [...cart],
          totalPrice,
          discount: totalPrice - finalPrice,
          finalPrice,
          amountPaid: paymentMethod !== 'Cash' ? finalPrice : paidAmount,
          paymentMethod,
          change: change ?? 0,
        };

        // Auto-print receipt if Bluetooth printer connected
        if (bt?.connected) {
          try {
            await bt.printReceipt({
              orderNumber: successData.orderNumber,
              items: cart,
              discount: totalPrice - finalPrice,
              totalPrice,
              finalPrice,
              amountPaid: successData.amountPaid,
              paymentMethod,
              change: successData.change,
              transactionDate: new Date().toISOString(),
            });
            toast.success('🖨️ Struk dicetak!');
          } catch (printErr) {
            toast.error('Gagal mencetak: ' + (printErr.message || ''));
          }
        }

        setSuccessState(successData);

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

  const handleNewTransaction = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid('');
    setPaymentMethod('Cash');
    setSuccessState(null);
    setShowConfirm(false);
  };

  const handlePrintReceipt = async () => {
    if (!successState) return;
    if (bt?.connected) {
      try {
        await bt.printReceipt({
          orderNumber: successState.orderNumber,
          items: successState.items,
          discount: successState.discount,
          totalPrice: successState.totalPrice,
          finalPrice: successState.finalPrice,
          amountPaid: successState.amountPaid,
          paymentMethod: successState.paymentMethod,
          change: successState.change,
          transactionDate: new Date().toISOString(),
        });
        toast.success('🖨️ Struk dicetak!');
      } catch (printErr) {
        toast.error('Gagal mencetak: ' + (printErr.message || ''));
      }
    } else {
      toast.info('Printer Bluetooth tidak terhubung');
    }
  };

  const filteredMenus = menus.filter((m) => m.category === filter);

  return (
    <div className="animate-fade-in">
      <div className="navbar" style={{ marginBottom: '12px', paddingBottom: '8px' }}>
        <div className="navbar-left">
          <h1 style={{ fontSize: '20px' }}>🛒 Transaksi</h1>
          <p style={{ fontSize: '12px' }}>Pilih menu untuk memulai pesanan</p>
        </div>
      </div>

      <div className="pos-container" style={{ gap: '16px' }}>
        {/* Menu Grid Column */}
        <div>
          <div className="btn-group" style={{ marginBottom: '12px' }}>
            <button className={`btn ${filter === 'Makanan' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Makanan')}>🍔 Makanan</button>
            <button className={`btn ${filter === 'Minuman' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Minuman')}>🥤 Minuman</button>
            <button className={`btn ${filter === 'Snack' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter('Snack')}>🍟 Snack</button>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat menu...</p></div>
          ) : (
            <div className="pos-menu-grid" style={{ gap: '10px' }}>
              {filteredMenus.map((menu) => {
                const outOfStock = menu.isStockSufficient === false;
                return (
                  <div
                    key={menu.id}
                    className="pos-menu-item"
                    onClick={() => !outOfStock && addToCart(menu)}
                    style={{
                      opacity: outOfStock ? 0.5 : 1,
                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                      position: 'relative',
                    }}
                  >
                    {outOfStock && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: 'var(--danger)', color: '#fff',
                        fontSize: '9px', fontWeight: '700', padding: '2px 6px',
                        borderRadius: '8px', zIndex: 1,
                      }}>Habis</div>
                    )}
                    {menu.image ? (
                      <div className="pos-menu-img">
                        <img src={menu.image} alt={menu.name} style={{ filter: outOfStock ? 'grayscale(0.6)' : 'none' }} />
                      </div>
                    ) : (
                      <div className="pos-menu-icon">
                        {menu.category === 'Minuman' ? '🥤' : menu.category === 'Snack' ? '🍟' : '🍔'}
                      </div>
                    )}
                    <div className="pos-menu-name">{menu.name}</div>
                    <div className="pos-menu-price">{formatCurrency(menu.price)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 1: Cart / Pesanan Panel for Desktop & Tablet (>= 768px) */}
        <div className="pos-cart pos-cart-desktop hide-mobile">
          <div className="pos-cart-header" style={{ padding: '12px 16px' }}>
            <h3 style={{ fontSize: '15px' }}>🧾 Pesanan</h3>
            {cart.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setCart([])} style={{ fontSize: '11px', padding: '4px 8px' }}>
                Hapus Semua
              </button>
            )}
          </div>

          <div className="pos-cart-items" style={{ padding: '12px' }}>
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
            <div className="pos-cart-footer" style={{ padding: '12px 16px' }}>
              <div className="pos-cart-total" style={{ borderBottom: 'none', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Sementara</span>
                <span className="total-value" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <button className="btn btn-primary w-full" onClick={() => setShowConfirm(true)} disabled={cart.length === 0}>
                💳 Bayar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Floating Cart Bar for Mobile (< 768px) */}
      {cart.length > 0 && (
        <div className="cart-float-bar show-mobile" onClick={() => setShowConfirm(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--primary)', color: '#fff',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '14px',
            }}>
              {cart.reduce((s, c) => s + c.quantity, 0)}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total Sementara</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>{formatCurrency(totalPrice)}</div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
            Bayar →
          </button>
        </div>
      )}

      {/* Step 2: Konfirmasi Pembayaran Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => !submitting && (successState ? handleNewTransaction() : setShowConfirm(false))}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%' }}>
            {successState ? (
              /* Step 3: Success State Screen inside Modal */
              <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--success-bg)', color: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px', margin: '0 auto 16px auto',
                  border: '2px solid var(--success)',
                }}>✓</div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Pembayaran Berhasil!
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Order No: <strong>{successState.orderNumber}</strong>
                </p>

                <div style={{
                  background: 'var(--bg-tertiary)', padding: '14px',
                  borderRadius: 'var(--radius-md)', marginBottom: '20px',
                  display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Metode:</span>
                    <strong>{successState.paymentMethod}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Pembayaran:</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '15px' }}>{formatCurrency(successState.finalPrice)}</strong>
                  </div>
                  {successState.paymentMethod === 'Cash' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: '700' }}>
                      <span>Kembalian:</span>
                      <span>{formatCurrency(successState.change)}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bt?.connected && (
                    <button className="btn btn-secondary w-full" onClick={handlePrintReceipt}>
                      🖨️ Cetak Struk
                    </button>
                  )}
                  <button className="btn btn-primary w-full" onClick={handleNewTransaction} style={{ padding: '12px', fontSize: '15px' }}>
                    ➕ Transaksi Baru
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Payment Form */
              <>
                <div className="modal-header">
                  <h2>Konfirmasi Pembayaran</h2>
                  <button className="modal-close" onClick={() => setShowConfirm(false)}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Brief item list */}
                  <div style={{ maxHeight: '140px', overflowY: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    {cart.map((item) => (
                      <div key={item.menuId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Diskon (Rp) Field */}
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Diskon (Rp)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={discount || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^0+(?=\d)/, '');
                        const val = Math.max(0, parseInt(raw) || 0);
                        setDiscount(val);
                      }}
                      min="0"
                      placeholder="0"
                    />
                    {discount > totalPrice && (
                      <small style={{ color: 'var(--danger)', fontSize: '11px' }}>
                        ⚠️ Diskon melebihi subtotal, di-cap ke {formatCurrency(totalPrice)}
                      </small>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Metode Pembayaran</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          onClick={() => {
                            setPaymentMethod(m);
                            if (m !== 'Cash') setAmountPaid('');
                          }}
                          style={{ flex: '1 1 45%', padding: '8px 12px', fontSize: '13px' }}
                        >
                          {m === 'Cash' ? '💵 Cash' : m === 'QRIS' ? '📱 QRIS' : m === 'Grab' ? '🟢 Grab' : '🟠 GoFood'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Uang Dibayar Field (Cash Only) */}
                  {paymentMethod === 'Cash' && (
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Uang Dibayar (Rp)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0"
                        autoFocus
                        style={{ fontSize: '16px', fontWeight: '700' }}
                      />
                    </div>
                  )}

                  {/* Final Summary Rows: Subtotal -> Diskon -> Total -> Kembalian */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>

                    {(totalPrice - finalPrice) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--danger)' }}>
                        <span>Diskon</span>
                        <span>-{formatCurrency(totalPrice - finalPrice)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(finalPrice)}</span>
                    </div>

                    {/* Kembalian Row (Cash Only) */}
                    {paymentMethod === 'Cash' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                        <span>Kembalian</span>
                        {paidAmount === 0 ? (
                          <span style={{ color: 'var(--text-tertiary)' }}>Rp 0</span>
                        ) : (change ?? 0) < 0 ? (
                          <span style={{ color: 'var(--danger)' }}>Kurang {formatCurrency(Math.abs(change ?? 0))}</span>
                        ) : (
                          <span style={{ color: 'var(--success)' }}>{formatCurrency(change ?? 0)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={submitting}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={!canConfirm}>
                    {submitting ? '⏳ Memproses...' : '✅ Konfirmasi & Bayar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
