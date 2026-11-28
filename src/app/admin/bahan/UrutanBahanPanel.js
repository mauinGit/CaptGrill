'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Lama menekan sebelum bahan bisa digeser (di HP). Di ikon pegangan langsung bisa digeser.
const LONG_PRESS_MS = 280;
// Kalau jari sudah bergeser sejauh ini sebelum waktu tekan habis, anggap sedang scroll.
const MOVE_TOLERANCE_PX = 8;

const formatQty = (v) => Number(v ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
const signature = (groups) => groups.flatMap((g) => g.items.map((i) => i.id)).join(',');
const pointOf = (e) => {
  const t = e.touches?.[0] || e.changedTouches?.[0];
  return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
};

/**
 * Panel "Atur Urutan" Manajemen Bahan.
 * Bahan ditekan-tahan lalu digeser di dalam kategorinya, atau pakai tombol naik/turun.
 * Urutan disimpan ke PUT /api/bahan/urutan dan dipakai di daftar stok & Salin Catatan.
 */
export default function UrutanBahanPanel({ toast, onClose, onSaved }) {
  const [groups, setGroups] = useState(null);
  const [initial, setInitial] = useState('');
  const [dragId, setDragId] = useState(null);
  const [saving, setSaving] = useState(false);

  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const bodyRef = useRef(null);
  const rowRefs = useRef(new Map());
  const drag = useRef(null);

  // Ambil semua bahan sekali saat panel dibuka (tanpa filter pencarian/kategori di halaman)
  const propsRef = useRef({ toast, onClose });
  propsRef.current = { toast, onClose };
  useEffect(() => {
    const { toast: notify, onClose: close } = propsRef.current;
    fetch('/api/bahan?sort=kategori')
      .then((res) => res.json())
      .then((data) => {
        const list = [];
        for (const item of Array.isArray(data) ? data : []) {
          const cat = item.category || 'Tanpa Kategori';
          let group = list.find((g) => g.cat === cat);
          if (!group) {
            group = { cat, items: [] };
            list.push(group);
          }
          group.items.push(item);
        }
        setGroups(list);
        setInitial(signature(list));
      })
      .catch(() => {
        notify.error('Gagal memuat daftar bahan');
        close();
      });
  }, []);

  const changed = groups !== null && signature(groups) !== initial;

  // Handler drag dibuat sekali (stabil) supaya listener di document bisa dilepas dengan benar.
  // Semua yang dipakai di dalamnya berupa ref atau setter state (keduanya stabil).
  const handlers = useRef(null);
  if (handlers.current === null) {
    const moveItem = (cat, from, to) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.cat !== cat || to < 0 || to >= g.items.length) return g;
          const items = [...g.items];
          const [picked] = items.splice(from, 1);
          items.splice(to, 0, picked);
          return { ...g, items };
        })
      );
    };

    const endDrag = () => {
      const d = drag.current;
      if (d?.timer) clearTimeout(d.timer);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', endDrag);
      document.removeEventListener('touchcancel', endDrag);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', endDrag);
      drag.current = null;
      setDragId(null);
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d) return;
      const pt = pointOf(e);

      if (!d.active) {
        if (Math.hypot(pt.x - d.startX, pt.y - d.startY) > MOVE_TOLERANCE_PX) endDrag();
        return;
      }

      if (e.cancelable) e.preventDefault(); // jangan scroll halaman saat menggeser

      // Gulir otomatis saat mendekati tepi daftar
      const body = bodyRef.current;
      if (body) {
        const box = body.getBoundingClientRect();
        if (pt.y < box.top + 56) body.scrollTop -= 12;
        else if (pt.y > box.bottom - 56) body.scrollTop += 12;
      }

      const group = groupsRef.current?.find((g) => g.cat === d.cat);
      if (!group) return;
      const index = group.items.findIndex((i) => i.id === d.id);

      // Posisi tujuan = jumlah bahan lain yang titik tengahnya ada di atas jari/mouse.
      // Dihitung langsung supaya gerakan cepat tetap mendarat di posisi yang benar.
      let target = 0;
      for (const other of group.items) {
        if (other.id === d.id) continue;
        const r = rowRefs.current.get(other.id)?.getBoundingClientRect();
        if (r && pt.y > r.top + r.height / 2) target += 1;
      }
      if (target !== index) moveItem(d.cat, index, target);
    };

    handlers.current = { moveItem, onMove, endDrag };
  }
  const { moveItem: move, onMove, endDrag } = handlers.current;

  // Lepas listener kalau panel ditutup saat sedang menggeser
  useEffect(() => endDrag, [endDrag]);

  /* ---------- Tekan-tahan & geser ---------- */
  function startPress(e, cat, id, immediate) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    endDrag();
    const pt = pointOf(e);
    const d = { id, cat, startX: pt.x, startY: pt.y, active: false, timer: null };
    drag.current = d;

    const activate = () => {
      d.active = true;
      setDragId(id);
      if (navigator.vibrate) navigator.vibrate(20);
    };
    if (immediate) activate();
    else d.timer = setTimeout(activate, e.type === 'mousedown' ? 150 : LONG_PRESS_MS);

    if (e.type === 'touchstart') {
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', endDrag);
      document.addEventListener('touchcancel', endDrag);
    } else {
      e.preventDefault(); // cegah teks ikut terseleksi
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', endDrag);
    }
  }

  const stop = (e) => e.stopPropagation();

  /* ---------- Simpan / tutup ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bahan/urutan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: groups.flatMap((g) => g.items.map((i) => i.id)) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Urutan bahan berhasil disimpan');
        onSaved();
      } else {
        toast.error(data.error || 'Gagal menyimpan urutan bahan');
      }
    } catch {
      toast.error('Tidak ada koneksi ke server. Coba lagi.');
    }
    setSaving(false);
  };

  const handleClose = () => {
    if (changed && !confirm('Urutan baru belum disimpan. Tutup tanpa menyimpan?')) return;
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal-lg urutan-modal" role="dialog" aria-modal="true" aria-label="Atur urutan bahan" onClick={stop}>
        <div className="modal-header">
          <h2>Atur Urutan Bahan</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Tutup"><Icon name="close" /></button>
        </div>

        <div className="modal-body urutan-body" ref={bodyRef}>
          <p className="urutan-hint">
            <Icon name="info" />
            <span>
              Tekan dan tahan bahan, lalu geser ke posisi yang diinginkan. Bisa juga pakai tombol panah.
              Urutan ini dipakai di daftar stok dan di Salin Catatan.
            </span>
          </p>

          {groups === null ? (
            <div className="empty-state"><div className="empty-state-icon"><Icon name="loader" /></div><p>Memuat bahan...</p></div>
          ) : groups.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon"><Icon name="box" /></div><p>Belum ada data bahan</p></div>
          ) : (
            groups.map((group) => (
              <section key={group.cat} className="urutan-group">
                <div className="urutan-cat"><Icon name="folder" /> {group.cat}</div>
                <ul className="urutan-list">
                  {group.items.map((item, index) => (
                    <li
                      key={item.id}
                      ref={(el) => (el ? rowRefs.current.set(item.id, el) : rowRefs.current.delete(item.id))}
                      className={`urutan-row${dragId === item.id ? ' dragging' : ''}`}
                      onTouchStart={(e) => startPress(e, group.cat, item.id, false)}
                      onMouseDown={(e) => startPress(e, group.cat, item.id, false)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <span
                        className="urutan-handle"
                        title="Geser untuk memindahkan"
                        onTouchStart={(e) => { e.stopPropagation(); startPress(e, group.cat, item.id, true); }}
                        onMouseDown={(e) => { e.stopPropagation(); startPress(e, group.cat, item.id, true); }}
                      >
                        <Icon name="grip" />
                      </span>
                      <span className="urutan-num">{index + 1}</span>
                      <span className="urutan-name">
                        {item.name}
                        <small>Stok {formatQty(item.stock)} {item.unit}</small>
                      </span>
                      <span className="urutan-btns" onTouchStart={stop} onMouseDown={stop}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm icon-btn"
                          onClick={() => move(group.cat, index, index - 1)}
                          disabled={index === 0}
                          aria-label={`Naikkan ${item.name}`}
                        >
                          <Icon name="arrow-up" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm icon-btn"
                          onClick={() => move(group.cat, index, index + 1)}
                          disabled={index === group.items.length - 1}
                          aria-label={`Turunkan ${item.name}`}
                        >
                          <Icon name="arrow-down" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!changed || saving}>
            {saving ? 'Menyimpan...' : 'Simpan Urutan'}
          </button>
        </div>
      </div>
    </div>
  );
}
