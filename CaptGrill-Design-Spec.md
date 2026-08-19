# CaptGrill — Design Specification Document

> Dokumen ini adalah context reference yang terus di-update seiring pembahasan setiap fitur. Mencakup spesifikasi lengkap sisi **Admin** (bagian 1–13: Design Tokens, Navigasi, Dashboard, dan seluruh halaman admin) dan sisi **Kasir** (bagian 14 dst). Salin bagian yang relevan ke AI Agent pembuat website saat implementasi.

---

## 1. Design Tokens (Global — berlaku di semua halaman)

### 1.1 Warna Brand
| Token | Hex/Value | Penggunaan |
|---|---|---|
| `--primary` | `#237227` | Warna hijau utama brand |
| `--primary-light` | `#2d8a32` | Varian terang, icon accent |
| `--primary-dark` | `#1a5a1e` | Gradient/hover state |
| `--primary-glow` | `rgba(35,114,39,0.15)` | Background icon lembut |
| `--accent` | `#fbd953` | Kuning emas — dipakai KHUSUS untuk menandai state "aktif" navigasi (sidebar/tab). Tidak dipakai untuk warna status lain agar tidak ambigu. |

### 1.2 Background & Netral
| Token | Light Mode | Dark Mode | Penggunaan |
|---|---|---|---|
| `--bg-primary` | `#f8fafc` | `#0f172a` | Background utama halaman |
| `--bg-secondary` | `#ffffff` | `#1e293b` | Background sekunder |
| `--bg-tertiary` | `#f1f5f9` | `#1e293b` | Header tabel, tombol sekunder, track progress bar |
| `--bg-card` | `#ffffff` | `#1e293b` | Card, panel, modal |
| `--bg-sidebar` | `#174C1A` | `#0f172a` | Background sidebar navigasi |
| `--bg-hover` | `#f1f5f9` | `#334155` | Hover state item/baris |
| `--bg-input` | `#ffffff` | `#334155` | Form input & select |

### 1.3 Warna Teks
| Token | Light | Dark | Deskripsi |
|---|---|---|---|
| `--text-primary` | `#0f172a` | `#f1f5f9` | Judul & teks utama |
| `--text-secondary` | `#475569` | `#94a3b8` | Subjudul/teks sekunder |
| `--text-tertiary` | `#94a3b8` | `#64748b` | Placeholder, label kecil, caption |
| `--text-inverse` | `#ffffff` | `#ffffff` | Teks di atas background gelap (sidebar) |

### 1.4 Warna Status
| Status | Teks | Background | Catatan Pemakaian |
|---|---|---|---|
| Success | `#22c55e` | `#f0fdf4` | Delta positif, konfirmasi |
| Warning | `#f59e0b` (amber — **bukan** `--accent`) | `#fffbeb` | Peringatan level "menipis" (belum kritis) |
| Danger | `#ef4444` | `#fef2f2` | Level "kritis", hapus, error |
| Info | `#3b82f6` | `#eff6ff` | Notifikasi informasional netral |

> **Catatan penting**: `--accent` (`#fbd953`) sengaja **tidak** dipakai sebagai warna warning di konten (stok, badge, dsb) karena warna itu sudah punya makna khusus sebagai penanda "item navigasi aktif". Kalau dipakai dobel, user bisa bingung membedakan makna warna kuning di layar yang sama.

### 1.5 Shadow
| Token | Value | Dipakai di |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Card default |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)` | Card on-hover |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)` | Summary card, drawer |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)` | Modal, bottom sheet |

### 1.6 Border & Radius
| Token | Value |
|---|---|
| `--border` | `#e2e8f0` |
| `--border-light` | `#f1f5f9` |
| Radius Sm | `8px` — tombol, input, badge |
| Radius Md | `12px` — icon box, card kecil |
| Radius Lg | `16px` — card besar, panel, modal |
| Radius Full | `9999px` — pill badge, progress bar, avatar |

### 1.7 Typography
- Font family: `Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif` (system font stack, konsisten dengan implementasi existing)
- Base font-size: `14px`
- Judul halaman (H1): `24px / 800 weight`
- Judul panel (H2/H3): `13–15px / 700–800 weight`
- Body/label: `12–13.5px`
- Caption/meta: `10–11.5px`, warna `--text-tertiary`

---

## 2. Navigasi Global

Pola navigasi **berbeda per breakpoint**, bukan cuma resize dari yang sama:
- **Laptop/Desktop (≥1024px)**: Sidebar permanen di kiri
- **Mobile & Tablet (<1024px)**: Bottom Tab Bar — karena user (admin & kasir) mayoritas akan pakai HP/tablet, laptop jarang dipakai

### 2.1 Sidebar (Laptop)

**Struktur & Layout**
- Posisi: fixed di sisi kiri, lebar `248px`, tinggi penuh viewport
- Background: `--bg-sidebar` (`#174C1A`)
- Padding internal: `20px 14px`

**Bagian dalam sidebar (top → bottom):**
1. **Brand header** — logo (36x36px, radius sm, background `--accent`) + nama "CaptGrill" (bold, putih, 16px) + subtitle "Admin Panel" (11px, putih 55% opacity)
2. **Label section** "MENU" — uppercase, 10.5px, letter-spacing, putih 40% opacity
3. **List item navigasi** — setiap item: icon (18px) + label (13.5px, medium weight), padding `10px 12px`, radius sm, warna default putih 75% opacity
4. **Footer akun** — menempel di bawah (margin-top: auto), dipisah border tipis dari list menu, berisi avatar (30px circle, background `--primary-light`) + nama user + role

**State aktif:**
- Background berubah jadi `--accent` (`#fbd953`) penuh
- Warna teks jadi gelap (`#1a1a1a`), font-weight 700
- Ini SATU-SATUNYA tempat warna accent dipakai sebagai indikator state, konsisten di seluruh sistem

**Isi menu (urutan tetap, sesuai role admin):**
1. Dashboard
2. Manajemen Bahan
3. Pembuatan Bahan
4. Manajemen Menu
5. Pengeluaran
6. Laporan
7. Absensi Karyawan
8. Gaji Karyawan
9. Manajemen Akun

> Catatan: Grafik Keuangan **tidak** lagi jadi item sidebar terpisah — sudah digabung sebagai widget di dalam Dashboard (lihat bagian 3). Log Aktivitas juga **dihapus dari sidebar** sesuai keputusan di bagian 8.4 (owner tidak membutuhkan halaman ini).

---

### 2.2 Bottom Tab Bar (Mobile & Tablet)

**Struktur & Layout**
- Posisi: fixed di bawah layar, full width, background putih (`--bg-card`)
- Border-top tipis (`--border-light`)
- Padding: `8px 6px 10px` (padding bawah lebih besar untuk safe-area di HP dengan gesture bar)
- Isi: 5 slot, rata kiri-kanan-tengah (`justify-content: space-around`)

**4 slot pertama = shortcut ke menu paling sering dipakai sehari-hari:**
1. Dashboard
2. Manajemen Bahan
3. Kasir (Transaksi/POS)
4. Laporan

**Slot ke-5 = "Lainnya"** — membuka Bottom Sheet berisi menu sisanya:
- Manajemen Menu
- Pembuatan Bahan (label singkat: "Bahan Racikan")
- Pengeluaran
- Absensi Karyawan
- Gaji Karyawan
- Manajemen Akun
- **Logout** — dipisahkan secara visual (warna merah/`--danger`) dari menu navigasi lain, karena ini action yang mengakhiri sesi, bukan berpindah halaman

> **Catatan**: "Grafik Keuangan" sudah **dihapus dari daftar ini** — tidak ada lagi halaman Grafik Keuangan terpisah. Widget grafik sudah terintegrasi ke dalam Dashboard (bagian 3.3.B). Jika masih muncul di menu implementasi lama, hapus item tersebut.

**Tampilan tiap tab item:**
- Icon (18px) + label (9.5px, bold)
- State aktif: warna berubah `--primary`, icon dibungkus circle background `--primary-glow` (34x34px)

**Bottom Sheet ("Lainnya"):**
- Muncul dari bawah, overlay gelap di belakangnya (`rgba(15,23,42,0.45)`)
- Card putih, radius atas `20px`, ada handle bar kecil di tengah atas
- Isi menu dalam grid 3 kolom, tiap item: icon (20px) + label (10.5px)
- Tap di luar sheet (area overlay) menutup sheet

**Alasan pemilihan pola ini** (untuk konteks AI Agent): Admin & kasir diasumsikan sering bolak-balik cepat antar 3–4 menu inti dalam satu sesi kerja (cek Dashboard → update stok Bahan → transaksi/cek Laporan), sehingga akses satu-jempolan untuk menu inti lebih penting daripada menampilkan semua menu sekaligus.

---

## 3. Halaman Dashboard

### 3.1 Widget yang Ditampilkan (final, sudah difinalisasi dari diskusi)

| Widget | Fungsi | Status |
|---|---|---|
| Transaksi Hari Ini | Jumlah transaksi hari ini + indikator naik/turun dari kemarin | ✅ Keep |
| Pemasukan Hari Ini | Total pemasukan hari ini + indikator naik/turun dari kemarin | ✅ Keep |
| Grafik Keuangan | Trend pemasukan vs pengeluaran, filter range waktu | ✅ Keep (dipindah dari sidebar) |
| Menu Terlaris Hari Ini | Ranking menu paling banyak terjual + qty + nilai | ✅ Keep |
| Stok Menipis | List bahan yang stoknya di bawah batas minimum, dengan progress bar & level severity | ✅ Keep (disederhanakan dari 2 widget jadi 1) |

**Widget yang DIHAPUS dari versi lama (dan alasannya, untuk konteks AI Agent — jangan dimunculkan lagi kecuali diminta ulang):**
- ~~Menu Tersedia (X/Y)~~ — dihapus, redundant dengan konsep stok menipis
- ~~Widget "Bulan Ini" (Pemasukan/Pengeluaran/Laba-Rugi bulanan)~~ — dihapus karena sudah tercover oleh Grafik Keuangan yang lebih informatif (trend, bukan cuma angka statis)
- ~~Counter angka "Stok Menipis" terpisah dari list detail~~ — digabung jadi 1 widget saja (list detail langsung, tanpa counter berdiri sendiri)

### 3.2 Urutan Tata Letak (berlaku SAMA baik Laptop maupun Mobile — top to bottom):

1. Page header: judul "Dashboard" + subtitle sapaan ("Selamat datang di CaptGrill Management")
2. Stat card row: **Transaksi Hari Ini** & **Pemasukan Hari Ini** (2 kartu bersebelahan)
3. Panel **Grafik Keuangan** (full width)
4. Panel **Menu Terlaris Hari Ini** (full width, di atas)
5. Panel **Stok Menipis** (full width, di bawah Menu Terlaris)

> **Keputusan desain penting**: Stok Menipis dan Menu Terlaris TIDAK ditampilkan side-by-side (2 kolom sejajar), melainkan ditumpuk vertikal satu-satu, full width, dengan urutan **Menu Terlaris lebih dulu, baru Stok Menipis**. Ini berlaku konsisten di layout laptop maupun mobile — tidak ada perbedaan urutan konten antar breakpoint, yang berbeda hanya lebar container dan ukuran elemen.

### 3.3 Spesifikasi Komponen

#### A. Stat Card (Transaksi Hari Ini / Pemasukan Hari Ini)
- Card: background `--bg-card`, border `--border-light`, radius lg (`16px`), shadow-sm default → shadow-md on hover
- Isi (kiri ke kanan): icon box (46x46px, radius md, background `--primary-glow` untuk icon hijau atau kuning muda custom untuk icon uang) → label kecil uppercase (`--text-tertiary`) → angka besar bold (24px) → delta indicator kecil (▲/▼ + persen, warna success/danger)
- Layout: grid 2 kolom equal-width di laptop maupun mobile (karena hanya 2 card, tetap sejajar di semua breakpoint — bukan ditumpuk)

#### B. Panel Grafik Keuangan
- Header panel: judul "📈 Grafik Keuangan" + filter range (tab pill: 7 Hari / 30 Hari / Bulan Ini) di kanan
- Legend kecil di bawah header: dot hijau = Pemasukan, dot merah = Pengeluaran
- Chart: line chart dengan area fill tipis, 2 series (Pemasukan warna `--primary`, Pengeluaran warna `--danger`), smooth curve, tanpa point marker (point radius 0) kecuali saat hover
- Sumbu Y: format currency singkat (contoh: "Rp 120k")
- Di mobile: chart tetap ditampilkan tapi versi ringkas/minimalis (axis disembunyikan agar hemat ruang, fokus ke bentuk trend saja)

#### C. Panel Menu Terlaris Hari Ini
- Header panel: judul "🏆 Menu Terlaris Hari Ini"
- List item (row), tiap row: badge ranking (kotak radius sm, angka 1 = background `--accent` warna gelap; angka 2/3/dst = background `--bg-tertiary` warna `--text-secondary`) + nama menu (bold) + qty terjual (kecil, `--text-tertiary`) + nilai penjualan rupiah (kanan, warna `--primary`, bold)
- Kalau belum ada penjualan hari itu: tampilkan empty state sederhana, teks di tengah, warna `--text-tertiary` (contoh: "Belum ada penjualan hari ini")

#### D. Panel Stok Menipis
- Header panel: judul "⚠️ Stok Menipis" + counter total item di kanan (contoh: "7 bahan")
- List item (row), tiap row berisi:
  - Nama bahan (bold) + badge status (pill, uppercase) — lihat logic di bawah
  - Progress bar tipis (6px height, radius full, track `--bg-tertiary`) — panjang fill proporsional terhadap sisa stok vs batas minimum
  - Angka di kanan: format "stok saat ini / batas minimum" + satuan
- **Logic 2 level severity** (selaras dengan §5.2 — hanya 3 status sistem, widget ini menampilkan 2 yang bermasalah):
  - 🟡 **Menipis** (warna warning `#f59e0b`, badge **"⚠ Menipis"**): `0 < stok_saat_ini <= stok_minimum`
  - 🔴 **Habis** (warna danger `#ef4444`, badge **"⛔ Habis"**): `stok_saat_ini == 0`
- Widget ini hanya menampilkan bahan yang kondisinya **Menipis atau Habis** — bahan dengan status Aman tidak muncul di sini
- List di-scroll kalau isinya banyak (max-height dengan overflow-y auto di laptop), di mobile biarkan scroll mengikuti scroll halaman utama
- **Constraint data penting**: stok tidak boleh pernah tampil sebagai angka negatif — ini terhubung ke validasi transaksi di sisi backend (lihat catatan di bagian 4)

> **Koreksi dari draft sebelumnya**: level "Kritis" (ambang tengah di 50% stok minimum) dihapus. Terminologi badge diselaraskan dengan §5.2: badge "KRITIS" diganti "Habis" dan hanya muncul saat stok benar-benar 0. Tidak ada lagi level antara yang ambigu.

### 3.4 Catatan Status Implementasi Dashboard

> **Gap Implementasi (per Agustus 2026)**: Build saat ini belum sepenuhnya mengikuti spec §3.1–3.3. Perbedaan yang perlu dikejar:
> - ❌ Widget "Menu Tersedia (X/Y)" masih muncul → harus dihapus
> - ❌ Widget "Bulan Ini" (Pemasukan/Pengeluaran/Laba-Rugi) masih muncul → harus dihapus
> - ❌ Widget Grafik Keuangan belum ada → perlu ditambahkan
> - ❌ Widget Stok Menipis masih berupa counter angka saja → perlu diubah ke list dengan progress bar
> - ❌ Widget Transaksi & Pemasukan Hari Ini tidak memiliki delta indicator (▲/▼) → perlu ditambahkan

### 3.5 Responsive Behavior Summary

| Elemen | Laptop (≥1024px) | Mobile/Tablet (<1024px) |
|---|---|---|
| Navigasi | Sidebar kiri permanen, 248px | Bottom tab bar fixed, 5 slot + sheet "Lainnya" |
| Stat card | 2 kolom sejajar, ukuran penuh | 2 kolom sejajar, ukuran diperkecil (tetap sejajar, bukan ditumpuk) |
| Grafik Keuangan | Full width, axis lengkap dengan label | Full width, axis disembunyikan (chart minimalis) |
| Menu Terlaris & Stok Menipis | Ditumpuk vertikal, full width, urutan: Menu Terlaris → Stok Menipis | Sama persis: ditumpuk vertikal, urutan: Menu Terlaris → Stok Menipis |
| Container | Max-width dengan padding besar (28px 32px) | Full width, padding lebih kecil (16px) |

---

## 4. Catatan Fungsional Terkait (bukan visual, tapi wajib diteruskan ke AI Agent sebagai konteks logic)

1. **Validasi stok tidak boleh minus**: Saat transaksi diproses di POS, sistem harus mengecek SEMUA bahan yang dibutuhkan dulu (cukup/tidak) sebelum benar-benar mengurangi stok manapun. Kalau ada satu bahan saja yang tidak cukup, seluruh transaksi ditolak dengan pesan error, bukan diproses sebagian.
2. **Batas minimum stok**: Field `stok_minimum` per bahan harus diisi admin sebagai angka ambang bawah yang jauh di bawah kapasitas restock normal (bukan disamakan dengan kapasitas penuh), supaya widget "Stok Menipis" di Dashboard tidak selalu penuh dengan hampir semua bahan (false alarm/noise).
3. **Alur restock bahan** (fitur belum dibuat, catatan untuk pengembangan lanjutan): perlu ada modul "Pembelian/Restock Bahan" agar penambahan stok tercatat otomatis terhubung ke Pengeluaran & Log Aktivitas, bukan admin edit manual angka stok.

---

## 5. Halaman Manajemen Bahan

> Status: ✅ **FINAL — disetujui**, siap diimplementasikan.

### 5.1 Fungsi Halaman
CRUD data bahan baku, sekaligus menjadi sumber kebenaran (source of truth) stok yang akan berkurang otomatis saat transaksi menu terjadi. Halaman ini menampilkan semua bahan, dikelompokkan per kategori, dengan indikator status stok.

### 5.2 Logic Status Stok (berlaku sistem-wide — dipakai juga di widget Stok Menipis Dashboard)

| Status | Kondisi | Warna | Badge |
|---|---|---|---|
| 🟢 Aman | `stok_saat_ini > stok_minimum` | `--success` (`#22c55e`) | "✓ Aman" |
| 🟡 Menipis | `0 < stok_saat_ini <= stok_minimum` | `--warning` (`#f59e0b`) | "⚠ Menipis" |
| 🔴 Habis | `stok_saat_ini == 0` | `--danger` (`#ef4444`) | "⛔ Habis" |

> **Perubahan dari draft sebelumnya**: level "Kritis" (ambang di tengah, misal 50% dari minimum) **dihapus**. Sistem hanya punya 3 status di atas — begitu stok mencapai 0, langsung berstatus "Habis", bukan level antara yang ambigu. Widget Stok Menipis di Dashboard (bagian 3.3.D) perlu disesuaikan mengikuti terminologi ini juga (badge "KRITIS" → "HABIS", hanya muncul saat stok benar-benar 0; selain itu pakai badge "Menipis").

### 5.3 Struktur Data Bahan (field form)

| Field | Tipe Input | Catatan |
|---|---|---|
| Nama Bahan | Text input | Wajib diisi |
| Kategori | **Text input + datalist** (bukan dropdown tetap) | Bisa ketik kategori baru bebas, tapi tetap menyarankan kategori yang sudah ada (autocomplete) untuk menghindari duplikat akibat typo (`"Sayur"` vs `"sayur"`) |
| Satuan | **Dropdown tetap** (bukan free text) | Opsi: `pcs`, `gram`, `kilogram (kg)`, `mililiter (ml)`, `liter (l)`, `butir`, `lembar`, `sachet`. Dropdown dikunci supaya perhitungan pengurangan stok otomatis di modul Menu nanti selalu konsisten satuannya |
| Stok Awal / Stok Saat Ini | Number input | Hanya muncul di form **Tambah Bahan** (create). Tidak muncul di form **Edit Bahan** |
| Stok Minimum (Alert) | Number input | Wajib diisi jauh di bawah kapasitas restock normal (bukan disamakan dengan stok awal). Form menampilkan hint/contoh langsung di bawah field ini untuk mencegah kesalahan input |

### 5.4 Pemisahan Aksi: Edit vs Restock (keputusan desain penting)

Berbeda dari CRUD form generik, aksi terhadap satu bahan dipecah jadi **3 tombol/aksi terpisah**, bukan 1 form "Edit" yang menggabungkan semuanya:

1. **✏️ Edit Data Bahan** — mengubah Nama, Kategori, Satuan, Stok Minimum. **Field stok TIDAK ada di form ini.** Ada note inline pengingat: *"Untuk mengubah jumlah stok, gunakan tombol Restock — bukan lewat form ini."*
2. **📦 Restock / Update Stok** — modal ringkas khusus, alur cepat:
   - Tampilkan Stok Saat Ini (angka besar, read-only)
   - Input "Tambah Stok (+)" — angka yang diketik akan **ditambahkan** ke stok saat ini (bukan replace)
   - Tombol quick-add (+5 / +10 / +25 / +50) untuk mempercepat input
   - Preview real-time "Stok setelah update: X" sebelum disimpan
   - Alasan dipisah dari Edit: ini aksi **paling sering dilakukan** admin sehari-hari (tiap kali belanja bahan), jadi harus jadi alur tercepat, bukan buka form penuh
3. **🗑️ Hapus Bahan**

### 5.5 Toolbar & Filter

- **Search bar** — cari bahan by nama, real-time filter
- **Filter kategori** — bentuk **chip/pill** (bukan dropdown terpisah), baris chip berisi "Semua" + semua kategori yang ada + chip "+ Kategori Baru" di ujung. Tabel/list **selalu tergroup per kategori by default** (tidak perlu toggle manual)
- **Tombol "Abjad"** — dihapus (tidak diperlukan, karena grouping kategori + search sudah cukup untuk navigasi)
- **Tombol "Salin Catatan"** — buka **modal preview** dulu (bukan langsung copy ke clipboard), menampilkan teks siap-copy dengan format:
  ```
  Bahan
  1. Ayam Kebab - 10 pcs
  2. Berry - 2500 gram

  Sayur
  1. Bawang Putih - 800 gram
  ```
  Grouped per kategori, dengan nomor urut, judul kategori tanpa nomor. Selalu menampilkan **semua bahan** (tidak ada opsi filter "stok rendah saja" — sesuai keputusan: cukup 1 versi lengkap).
- **Tombol "+ Tambah Bahan"** — buka alur tambah data baru (lihat 5.6 untuk perbedaan pola per device)

### 5.6 Layout & Navigasi per Device

#### A. Laptop
- Tabel penuh dengan kolom: Nama Bahan, Satuan, Stok (dengan mini progress bar inline), Min. Stok, Status (badge pill), Aksi (3 icon: edit/restock/hapus)
- Baris header grup kategori: background kuning muda (`#fdf8e8`), teks coklat gelap (`#92720a`), diawali icon 📁
- **Tambah Bahan** dan **Edit Bahan** dibuka sebagai **modal di tengah layar** (dialog box, width ±460px) — karena di laptop ruang layar cukup luas, modal sederhana sudah cukup nyaman
- **Restock** juga modal, tapi versi ringkas (lihat 5.4.2)

#### B. HP (Mobile)
- List tabel diganti **card list** vertikal, tiap card: nama + meta (stok/min + satuan) + progress bar mini + badge status + tombol kebab (⋮)
- Tap card atau kebab → membuka **bottom sheet** dengan 3 opsi aksi: 📦 Update/Restock Stok, ✏️ Edit Data Bahan, 🗑️ Hapus Bahan (opsi hapus diberi warna merah/danger untuk membedakan dari 2 aksi lain)
- **Tambah Bahan**: tombol **FAB (+)** mengambang di kanan-bawah (di atas bottom tab bar) → membuka **halaman penuh** (full-screen page, animasi slide dari bawah), dengan tombol back (←) di header dan tombol "Simpan Bahan" yang sticky menempel di bagian bawah layar
- Alasan pola full-screen (bukan modal kecil): layar HP sempit, form butuh seluruh ruang supaya nyaman diisi satu tangan; tombol Simpan sticky di bawah supaya selalu terjangkau jempol tanpa perlu scroll cari tombolnya dulu

#### C. Tablet
- **Layout konten mirip laptop** — tabel penuh dengan kolom yang sama persis (Nama Bahan, Satuan, Stok dengan mini progress bar, Min. Stok, Status, Aksi), toolbar (search, Salin Catatan, Tambah Bahan), chip filter kategori, dan grouping per kategori — semua identik dengan versi laptop, bukan disederhanakan jadi card list seperti pola awal
- **Navigasi tetap ikut aturan device** — meskipun kontennya mirip laptop, navigasi tablet tetap pakai **Bottom Tab Bar** (bukan sidebar), konsisten dengan keputusan navigasi global di bagian 2.2 (mobile & tablet <1024px pakai Bottom Tab Bar)
- **Tambah Bahan**: tombol "+ Tambah Bahan" di kanan atas → membuka **panel geser dari kanan (side panel/drawer)**, lebar ±400px (~45–50% layar), dengan overlay redup di sisa layar (list bahan di kiri masih terlihat, tidak full ditutup)
- **Edit Bahan, Restock, dan Salin Catatan**: tetap pakai **modal dialog di tengah** (sama seperti laptop), karena pola interaksi ini sudah pas untuk layar selebar tablet — tidak perlu pola khusus seperti HP
- Alasan pola tambah data berbeda dari HP: layar tablet cukup lebar untuk tetap menampilkan list di belakang sebagai konteks, tidak perlu full-screen takeover seperti di HP

### 5.7 Ringkasan Perbedaan Pola "Tambah Data" per Device

| Device | Konten/Layout Halaman | Pola "Tambah Bahan" | Pola Edit/Restock/Salin Catatan |
|---|---|---|---|
| Laptop | Tabel penuh + sidebar | Modal dialog di tengah layar | Modal dialog di tengah layar |
| Tablet | Tabel penuh (mirip laptop) + Bottom Tab Bar | Side panel/drawer dari kanan (~45% lebar layar) | Modal dialog di tengah layar |
| HP | Card list + Bottom Tab Bar | Full-screen page (slide dari bawah, ada tombol back) | Bottom sheet (aksi: Restock/Edit/Hapus) |

### 5.8 Filter Kategori — Fungsional, Bukan Statis

Chip filter kategori (termasuk chip "+ Kategori Baru") bersifat interaktif di **semua device** (laptop, tablet, HP):
- Klik salah satu chip kategori → memfilter tabel/list ke kategori tersebut (state aktif berpindah ke chip yang diklik)
- Klik chip **"+ Kategori Baru"** → memunculkan input untuk mengetik nama kategori baru → kategori baru otomatis muncul sebagai chip baru di filter, dan otomatis tersinkron ke datalist kategori di form Tambah Bahan maupun Edit Bahan (jadi begitu kategori baru dibuat lewat filter, langsung bisa dipakai/dipilih saat mengisi form bahan, tanpa perlu input manual ulang)

---

## 6. Halaman Pembuatan Bahan

> Status: ✅ Disetujui.

### 6.1 Konsep & Pemisahan Tanggung Jawab (penting untuk konteks AI Agent)

Fitur ini punya 2 sisi yang **harus dipisah jelas**, jangan digabung jadi satu alur:

1. **Admin (halaman ini)** — hanya mengelola **definisi resep/formula**: bahan apa saja jadi komposisi, dan berapa takarannya untuk menghasilkan bahan olahan. Contoh: "Patty" terdiri dari Daging, Garam, Minyak dengan takaran tertentu. Perubahan di sini **tidak** langsung mengubah stok apapun — ini murni data resep.
2. **Kasir — halaman terpisah "Bahan / Produksi Bahan"** (bagian 16) — tempat **eksekusi produksi aktual** terjadi: kasir memilih resep dan jumlah produksi, lalu sistem memotong stok bahan dasar (Daging, Garam, Minyak) dan menambah stok bahan hasil (Patty) sesuai takaran × jumlah. Halaman ini terpisah dari Absensi — meskipun Absensi juga punya Tujuan "Buat Bahan" (bagian 11.2), itu murni penanda kehadiran/tugas produksi hari itu (untuk keperluan Gaji Produksi, bagian 12), bukan tempat eksekusi produksi itu sendiri. Detail lengkap hubungan keduanya ada di bagian 16.5.

> **Riwayat koreksi catatan ini** (untuk transparansi): draft paling awal mencatat perlunya "menu baru terpisah Produksi Bahan di Kasir". Draft berikutnya sempat mengoreksi ini jadi "terintegrasi ke alur Absensi, tidak perlu menu terpisah" — namun setelah melihat struktur navigasi Kasir yang sesungguhnya (bagian 14.2), ternyata **memang ada halaman terpisah bernama "Bahan"** di Bottom Tab Bar Kasir, dan itulah tempat eksekusi produksi terjadi. Jadi kesimpulan akhirnya kembali mendekati catatan paling awal: ada halaman/menu tersendiri untuk ini — hanya saja hubungannya dengan Absensi bersifat independen (bagian 16.5), bukan tergabung dalam satu alur.

> **Alasan pemisahan definisi vs eksekusi tetap penting**: resep hanya perlu dibuat/diedit sesekali oleh admin (jarang berubah), sementara produksi aktual terjadi berkali-kali tiap hari oleh karyawan di lapangan. Menggabungkan keduanya dalam satu form akan membuat alur kerja harian jadi tidak efisien.

### 6.2 Struktur Data Resep

| Field | Tipe Input | Catatan |
|---|---|---|
| Bahan Hasil Produksi | **Combobox searchable** (bukan dropdown scroll biasa) | Wajib memilih dari bahan yang sudah terdaftar di Manajemen Bahan (bukan free text). Nama resep otomatis mengikuti nama bahan ini — tidak ada field "Nama Resep" terpisah |
| Komposisi Bahan Dasar | List baris dinamis, tiap baris: Combobox searchable (bahan) + Jumlah (number) + Satuan (read-only, otomatis ikut satuan terdaftar bahan tsb) + tombol hapus baris | Tombol "+ Tambah Bahan" menambah baris kosong baru |

**Asumsi desain yang diambil (perlu dikonfirmasi ke user sebelum implementasi final)**: 1 bahan hasil hanya boleh punya 1 resep aktif. Karena itu, field **Bahan Hasil Produksi dikunci/read-only saat mode Edit** — kalau admin ingin resep baru untuk bahan yang berbeda, harus buat entri resep baru, bukan mengganti bahan hasil dari resep yang sudah ada. Alasan: mencegah histori produksi jadi rancu (resep yang sudah punya riwayat produksi tidak boleh tiba-tiba "berpindah identitas" ke bahan lain). *(Kalau ternyata bisnis butuh multi-varian resep untuk 1 bahan hasil yang sama, field "Nama Resep" terpisah perlu dikembalikan — belum diimplementasikan karena belum dikonfirmasi kebutuhannya.)*

### 6.3 Searchable Combobox — Spesifikasi Perilaku

Menggantikan dropdown `<select>` biasa yang mengharuskan scroll manual (masalah nyata karena daftar bahan sudah panjang & akan terus bertambah). Perilaku:
- User mengetik di input text → list difilter real-time berdasarkan kecocokan substring nama bahan (case-insensitive)
- Hasil filter ditampilkan maksimal ±8 item dalam dropdown mengambang di bawah input, masing-masing menampilkan `Nama Bahan (satuan)`
- Klik salah satu hasil → mengisi input dengan nama bahan tsb, dan otomatis mengisi kotak Satuan di sebelah kanan sesuai satuan bahan tersebut (kotak Satuan **read-only**, tidak bisa diketik manual)
- Kalau tidak ada hasil cocok → tampilkan pesan "Bahan tidak ditemukan" di dalam dropdown

### 6.4 Layout per Device

Mengikuti pola yang sama dengan Manajemen Bahan (bagian 5.6–5.7):

| Device | Layout List | Pola Tambah/Edit Resep |
|---|---|---|
| Laptop | Tabel (kolom: Bahan Hasil [badge], Komposisi [tag-tag kecil], Aksi) + sidebar | Modal dialog di tengah layar |
| Tablet | Tabel sama seperti laptop + Bottom Tab Bar | Side panel/drawer dari kanan |
| HP | Card list (tiap card: badge bahan hasil + tag-tag komposisi) + Bottom Tab Bar | Full-screen page (slide dari bawah) untuk Tambah; Bottom sheet (Edit/Hapus) untuk aksi per item |

Tabel list disederhanakan dari draft awal — kolom "Nama Resep" dihapus (redundant dengan Bahan Hasil), tersisa 2 kolom utama: Bahan Hasil dan Komposisi Bahan Dasar (ditampilkan sebagai tag-tag kecil agar mudah di-scan tanpa perlu buka detail).

### 6.5 Validasi yang Perlu Diterapkan di Backend (catatan fungsional)
- Bahan hasil produksi wajib dipilih dari data yang sudah ada di Manajemen Bahan, tidak boleh input bebas
- Sebuah bahan tidak boleh menjadi komponen dari dirinya sendiri (self-reference) dalam satu resep
- Bahan dasar yang sama tidak boleh dipilih dua kali dalam komposisi resep yang sama
- Field Bahan Hasil Produksi tidak dapat diubah setelah resep dibuat (lihat 6.2)

---

## 7. Halaman Manajemen Menu

> Status: ✅ Disetujui.

### 7.1 Konsep

Menu adalah item yang dijual ke pelanggan dan muncul di POS Kasir. Setiap menu punya **komposisi bahan** (bisa bahan dasar dari Manajemen Bahan, maupun bahan olahan hasil resep di Pembuatan Bahan — keduanya berasal dari satu sumber data yang sama karena bahan olahan juga terdaftar di Manajemen Bahan). Saat 1 menu terjual di Kasir, seluruh bahan dalam komposisinya berkurang otomatis sesuai takaran × jumlah terjual.

### 7.2 Struktur Data Menu

| Field | Tipe Input | Catatan |
|---|---|---|
| Foto Menu | Upload gambar (JPG/PNG, maks 5MB) | Setelah upload, tampilkan **preview thumbnail** menggantikan placeholder ikon. Saat mode Edit, tampilkan nama file + opsi "Ganti Foto". Rasio disarankan 1:1 agar konsisten di grid admin maupun POS Kasir |
| Nama Menu | Text input | Wajib diisi |
| Harga (Rp) | Number input | Wajib diisi |
| Kategori | **Dropdown tetap** — hanya 3 opsi: `Makanan`, `Minuman`, `Snack` | **Berbeda dari kategori Bahan** yang bebas ditambah — kategori menu sengaja dikunci karena dipakai sebagai tab filter tetap di POS Kasir, harus konsisten dan terbatas |
| Komposisi Bahan | List baris dinamis: Combobox searchable (bahan) + Jumlah (number) + Satuan (read-only, otomatis ikut bahan terpilih) + tombol hapus baris | Pola & sumber data sama persis dengan Komposisi Bahan Dasar di Pembuatan Bahan (bagian 6.3) — bahan dasar maupun bahan olahan bisa dipilih dari combobox yang sama |

### 7.3 Status Ketersediaan Menu (logic penting — dihitung otomatis)

Menggantikan konsep "Menu Tersedia" yang sebelumnya sempat direncanakan sebagai widget Dashboard (lihat catatan di bagian 3.1) — logic ini lebih tepat berada di halaman Manajemen Menu dan POS Kasir, bukan sebagai widget ringkasan Dashboard.

- Sistem mengecek **seluruh bahan dalam komposisi** sebuah menu secara real-time
- Jika **semua bahan cukup** untuk minimal 1 porsi → badge **"✓ Tersedia"** (hijau)
- Jika **ada 1 saja bahan yang tidak cukup** → badge **"⛔ Stok Tidak Cukup"** (merah, disingkat "Habis" di tampilan HP karena ruang terbatas)
- Status ini **tidak diinput manual oleh admin** — murni hasil kalkulasi dari data stok bahan terkini
- Status yang sama dipakai untuk **otomatis menonaktifkan menu di POS Kasir** — kasir tidak akan bisa memilih/menjual menu yang bahannya sudah tidak cukup, tanpa admin perlu mematikan menu secara manual satu per satu

### 7.4 Layout & Tampilan

- **List ditampilkan sebagai grid kartu** (bukan tabel seperti Bahan/Resep) — karena setiap menu punya foto, kartu lebih tepat untuk konten visual dibanding baris tabel teks
- Tiap kartu berisi: foto (dengan badge status di pojok), nama, kategori, harga, jumlah item komposisi, tombol aksi (Edit/Hapus)
- Filter kategori: chip tetap (Semua/Makanan/Minuman/Snack), bukan dinamis
- Search bar: cari menu by nama

### 7.5 Layout per Device

Mengikuti pola yang sama dengan Manajemen Bahan & Pembuatan Bahan (bagian 5.6–5.7, 6.4):

| Device | Layout List | Pola Tambah/Edit Menu |
|---|---|---|
| Laptop | Grid kartu 3 kolom + sidebar | Modal dialog di tengah layar |
| Tablet | Grid kartu 3 kolom (mirip laptop) + Bottom Tab Bar | Side panel/drawer dari kanan |
| HP | Grid kartu 2 kolom + Bottom Tab Bar | Full-screen page (slide dari bawah) untuk Tambah; Bottom sheet (Edit/Hapus) untuk aksi per item |

### 7.6 Catatan Fungsional untuk Fase Berikutnya
- Saat transaksi menu terjadi di Kasir, seluruh bahan dalam komposisi menu tersebut dikurangi dari stok sesuai takaran × jumlah terjual — validasi "stok cukup sebelum transaksi diproses" mengikuti aturan yang sudah ditetapkan di bagian 4 (validasi stok tidak boleh minus)
- Field harga bahan (harga beli per satuan) **belum ada** di struktur data Manajemen Bahan saat ini, sehingga sistem belum bisa menghitung estimasi HPP (harga pokok produksi) atau margin otomatis per menu — ini bisa jadi pertimbangan pengembangan lanjutan jika dibutuhkan, tapi belum masuk scope saat ini

---

## 8. Fiksasi Struktur Navigasi Admin (Sidebar) & Hubungan Antar Modul Keuangan

> Status: ✅ Disetujui — keputusan arsitektur informasi final untuk sisi Admin.

### 8.1 Sidebar Final Admin

1. Dashboard
2. Manajemen Bahan
3. Pembuatan Bahan
4. Manajemen Menu
5. Pengeluaran
6. Laporan
7. Absensi Karyawan
8. Gaji Karyawan
9. Manajemen Akun

**Grafik Keuangan dihapus dari sidebar** — sudah dipindahkan menjadi widget di dalam Dashboard sejak bagian 3 (bukan halaman/menu terpisah).

**Log Aktivitas dihapus dari sidebar** — lihat keputusan final di bagian 8.4 (direvisi dari rencana awal yang sempat mempertahankannya).

### 8.2 Hubungan Pengeluaran ↔ Gaji Karyawan (keputusan penting)

Pengeluaran dan Gaji Karyawan **tidak digabung menjadi satu CRUD**, tetapi **saling terhubung**:

- **Pengeluaran** = input manual, ad-hoc, kapan saja (beli bahan, perabotan, servis alat, dll) — halaman CRUD biasa
- **Gaji Karyawan** = hasil **kalkulasi** dari data Absensi + rate gaji karyawan, diproses berkala (bukan diketik manual seperti pengeluaran biasa)
- **Begitu gaji berstatus "Dibayar"**, sistem **otomatis membuat entri baru di Pengeluaran** (kategori khusus, misal "Gaji Karyawan") — entri ini **read-only** di sisi halaman Pengeluaran (tidak bisa diedit/dihapus manual dari sana, karena sumber data aslinya dari modul Gaji Karyawan)
- Alasan: supaya Laba/Rugi di Dashboard, Laporan, dan Grafik Keuangan tetap akurat (gaji yang dibayarkan adalah uang keluar riil dan wajib terhitung), tanpa terjadi input ganda atau data yang tidak sinkron antar 2 modul

**Prinsip yang sama akan berlaku untuk modul Restock Bahan** (dicatat sebagai catatan fungsional di bagian 4) — begitu modul itu dibangun, pembelian bahan juga akan otomatis membuat entri read-only di Pengeluaran, mengikuti pola yang sama seperti Gaji Karyawan di atas.

### 8.3 Halaman Laporan = View-Only, Bukan Tempat Input

Laporan tidak menerima input data secara langsung. Perannya murni menampilkan gabungan data dari modul-modul lain (Transaksi, Pengeluaran — termasuk yang berasal dari Gaji Karyawan, breakdown metode pembayaran) dengan filter tanggal, sesuai rencana awal. Input data selalu dilakukan di halaman sumbernya masing-masing (Pengeluaran untuk pengeluaran manual, Gaji Karyawan untuk proses gaji, dst) — bukan dari Laporan.

Alasan: memisahkan tanggung jawab "baca vs tulis" mencegah halaman Laporan menjadi kompleks (form + tabel + filter tercampur) dan menjaga konsistensi data karena setiap jenis data hanya punya satu titik masuk (single source of entry).

### 8.4 Log Aktivitas — DIHAPUS dari Scope (revisi keputusan)

> **Update terbaru**: setelah dikonfirmasi ke owner, **Log Aktivitas tidak dibutuhkan** dan dihapus dari sidebar & scope produk. Ini merevisi keputusan sebelumnya di draft dokumen ini yang sempat mempertahankannya sebagai fitur prioritas rendah.

**Konteks alasan sebelumnya** (untuk referensi historis, sudah tidak berlaku): draf awal sempat mempertimbangkan Log Aktivitas berguna untuk jejak audit lintas-sistem karena banyak pengguna mengakses data sensitif. Namun setelah dikonfirmasi ke owner secara langsung, kebutuhan tersebut **tidak dirasakan perlu** — sehingga dihapus untuk menjaga scope tetap ramping dan fokus ke masalah inti (stok & operasional harian).

**Catatan penting — prinsip jejak audit tetap dipertahankan di level modul masing-masing**, terlepas dari dihapusnya halaman Log Aktivitas terpusat:
- Absensi Karyawan tetap pakai soft-reject + alasan (bagian 11.3), bukan hapus permanen
- Pengeluaran dari Gaji Karyawan tetap terkunci read-only (bagian 8.2, 9.2)
- Akun Kasir dinonaktifkan saat sudah tidak digunakan, bukan dihapus permanen (bagian 13.5)

Jadi meskipun tidak ada satu halaman terpusat yang mencatat "siapa mengubah apa, kapan" di seluruh sistem, setiap modul yang butuh akuntabilitas tetap punya mekanisme jejaknya sendiri secara lokal — prinsip ini tidak berubah, hanya implementasinya tidak dipusatkan dalam satu halaman Log Aktivitas.

---

## 9. Halaman Pengeluaran

> Status: ✅ Disetujui.

### 9.1 Struktur Data Pengeluaran

| Field | Tipe Input | Catatan |
|---|---|---|
| Kategori | **Dropdown tetap** (bukan bebas ditambah) | Dipakai untuk pengelompokan di Laporan, sehingga harus konsisten & terbatas. Daftar kategori: `Pembelian Bahan`, `Peralatan & Perlengkapan`, `Sewa & Utilitas`, `Perawatan & Servis`, `Marketing & Promosi`, `Lain-lain`, ditambah 1 kategori khusus `Gaji Karyawan` yang **tidak muncul sebagai pilihan manual** di form (lihat 9.2). *(Daftar ini adalah asumsi awal berdasarkan pola umum bisnis F&B — dapat disesuaikan lebih lanjut sesuai kebutuhan operasional aktual.)* |
| Deskripsi | Text input | Keterangan bebas |
| Nominal (Rp) | Number input | Wajib diisi |
| Tanggal | Date picker | Default: tanggal hari ini |

### 9.2 Entri Otomatis dari Modul Lain (Gaji Karyawan, dan nanti Restock Bahan)

Mengikuti keputusan di bagian 8.2: entri yang berasal dari modul lain (saat ini: Gaji Karyawan; ke depan: Restock Bahan) muncul di halaman Pengeluaran dengan **perlakuan berbeda dari entri manual**:

- **Kategori "Gaji Karyawan" tidak tersedia sebagai pilihan** di dropdown form Tambah Pengeluaran — mencegah admin input ganda secara manual untuk sesuatu yang seharusnya otomatis
- Baris entri otomatis di tabel/list ditampilkan dengan **background berbeda** (abu-abu lebih redup dari baris manual) dan **badge kunci 🔒**
- Kolom Aksi untuk baris ini **tidak berisi tombol Edit/Hapus**, melainkan tautan **"Lihat Detail"** yang mengarahkan ke halaman sumber datanya (Gaji Karyawan)
- Tujuan: mencegah data ganda atau tidak sinkron antara Pengeluaran dan modul sumbernya, sekaligus menjaga integritas perhitungan Laba/Rugi di Dashboard, Laporan, dan Grafik Keuangan

### 9.3 Ringkasan Total Periode

Di atas tabel/list ditampilkan kartu ringkasan (highlight warna brand) berisi **Total Pengeluaran** yang otomatis mengikuti filter tanggal (date range) dan filter kategori (chip) yang sedang aktif, beserta jumlah transaksi dalam periode tersebut. Tujuannya agar admin tidak perlu membuka halaman Laporan hanya untuk mengetahui total pengeluaran suatu periode.

### 9.4 Filter & Toolbar

- **Date range picker** (dari — sampai) — filter utama, sudah ada di desain awal, dipertahankan
- **Filter kategori** — chip/pill (Semua + semua kategori tetap), bukan dropdown terpisah
- Tombol **"+ Tambah Pengeluaran"** membuka form sesuai pola per device (lihat 9.5)

### 9.5 Layout per Device

Mengikuti pola yang sama dengan modul-modul sebelumnya:

| Device | Layout List | Pola Tambah Pengeluaran |
|---|---|---|
| Laptop | Tabel + sidebar | Modal dialog di tengah layar |
| Tablet | Tabel (mirip laptop) + Bottom Tab Bar | Modal dialog (form pengeluaran sederhana, tidak memerlukan side panel lebar seperti form dengan komposisi bahan) |
| HP | Card list (ringkasan total di atas, tiap card: deskripsi, tanggal, nominal, kategori, aksi) + Bottom Tab Bar | Full-screen page (slide dari bawah) |

Catatan: berbeda dari Manajemen Bahan/Menu/Pembuatan Bahan, form Pengeluaran cukup sederhana (tanpa combobox searchable atau komposisi dinamis), sehingga untuk Tablet cukup memakai modal dialog seperti Laptop — tidak perlu pola side panel lebar yang sebelumnya dipakai untuk form dengan banyak baris komposisi.

---

## 10. Halaman Laporan

> Status: ✅ Disetujui. Sifatnya **view-only** (lihat prinsip di bagian 8.3) — tidak ada input/CRUD data di halaman ini.

### 10.1 Toolbar — Disederhanakan

Dari desain awal yang punya 4 tombol (Tampilkan, Export Excel, Sync Google Sheets, Buka Google Sheets), disederhanakan menjadi **2 tombol saja**:
- **Tampilkan** — menerapkan filter rentang tanggal (Dari Tanggal — Sampai Tanggal)
- **Export Excel** — mengunduh hasil laporan sesuai filter yang sedang aktif, dalam format `.xlsx`

**Sync Google Sheets & Buka Google Sheets dihapus dari scope.** Keputusan ini diambil karena:
- Sinkronisasi 2 arah dengan API eksternal (Google Sheets) menambah titik gagal (OAuth, kuota API, token expired) yang bisa membuat data di Sheets tidak sinkron dengan data asli di sistem tanpa disadari owner
- Sistem tetap harus menjadi satu-satunya sumber kebenaran (single source of truth) — Export Excel on-demand sudah cukup memenuhi kebutuhan owner untuk melihat data dalam format yang familiar, tanpa risiko dan kompleksitas maintenance jangka panjang dari sinkronisasi otomatis
- Kalau owner tetap ingin data di Google Sheets, itu jadi pilihan dia sendiri (upload manual file hasil export), bukan tanggung jawab sistem untuk menjaga sinkronnya terus-menerus

### 10.2 Kartu Ringkasan

Tiga kartu di bagian atas: **Total Pemasukan** (hijau), **Total Pengeluaran** (merah), **Laba/Rugi** (warna mengikuti brand, bisa ditambahkan logic warna merah jika hasilnya negatif/rugi). Angka mengikuti filter tanggal yang sedang aktif.

### 10.3 Breakdown Metode Pembayaran

Empat kartu kecil menampilkan total nominal per metode pembayaran: **Cash**, **Grab**, **QRIS**, **GoFood** — mengikuti filter tanggal aktif. Daftar metode ini mengikuti apa yang sudah ada di desain awal; dapat disesuaikan jika ada metode pembayaran lain yang digunakan di operasional nyata.

### 10.4 Section Transaksi — Filter Shift

Menampilkan daftar transaksi (waktu, nama menu yang dibeli, kasir yang bertugas, metode pembayaran, total) dengan **filter chip Shift**: `Semua` / `🌅 Shift 1 (06:00–15:00)` / `🌙 Shift 2 (15:00–06:00)`.

**Alasan filter shift ada di sini**: untuk kebutuhan rekonsiliasi kas per giliran jaga kasir — tiap kasir perlu tahu total penjualan di shift-nya sendiri untuk keperluan serah terima kas/cocok-cocokan dengan laci kasir saat tutup shift. Ini kebutuhan operasional nyata di sisi kasir.

### 10.5 Section Pengeluaran — TIDAK Ada Filter Shift

Menampilkan daftar pengeluaran (tanggal, deskripsi, kategori, nominal) — mengikuti struktur data & tampilan yang sudah ditetapkan di bagian 9 (termasuk baris otomatis dari Gaji Karyawan dengan badge 🔒, lihat 9.2).

**Alasan sengaja tidak diberi filter shift**, berbeda dari section Transaksi:
- Pengeluaran kebanyakan diinput oleh **admin**, bukan kasir, dan tidak selalu terjadi saat ada kasir yang sedang bertugas (contoh: bayar sewa, gaji karyawan, servis alat — kejadian ini tidak terikat pada "siapa yang shift saat itu")
- Pengeluaran secara alami dikelompokkan berdasarkan **kategori** (bagian 9.1), bukan berdasarkan shift kerja — memaksakan dimensi shift pada pengeluaran tidak sesuai dengan cara pengguna berpikir tentang data ini
- *(Catatan untuk pengembangan lanjutan, belum masuk scope saat ini)*: jika di masa depan ada kebutuhan pengeluaran kas kecil yang diambil langsung dari laci kasir saat shift berlangsung (misal kasir membeli sesuatu mendesak dengan uang di laci), itu adalah kasus khusus yang lebih tepat ditangani sebagai fitur terpisah di sisi POS Kasir (bukan dipaksakan ke struktur Pengeluaran admin yang sudah ada)

### 10.6 Layout per Device

Karena halaman ini view-only (tanpa modal tambah/edit), strukturnya seragam di semua device — hanya menyesuaikan lebar kolom dan ukuran elemen:

| Device | Layout |
|---|---|
| Laptop | Filter panel horizontal, 3 kartu ringkasan sejajar, 4 kartu pembayaran sejajar, section Transaksi & Pengeluaran full width + sidebar |
| Tablet | Sama seperti laptop (kartu ringkasan & pembayaran tetap sejajar bila muat) + Bottom Tab Bar |
| HP | Filter panel & tombol ditumpuk vertikal, kartu ringkasan ditumpuk 1 kolom, kartu pembayaran grid 2 kolom, section Transaksi & Pengeluaran tetap list vertikal + Bottom Tab Bar |

---

## 11. Halaman Absensi Karyawan

> Status: ✅ Disetujui.

### 11.1 Konteks & Alur

Karyawan login ke akun masing-masing lewat **panel Kasir**, lalu melakukan absensi dengan memilih salah satu dari **3 Tujuan**: 🌅 Shift 1, 🌙 Shift 2, atau 🧪 **Buat Bahan** (mengambil foto selfie + lokasi GPS tercatat otomatis di ketiga jenis Tujuan). Hasil absensi tersebut masuk ke halaman ini untuk direview oleh admin/owner. Detail alur absensi dari sisi Kasir dibahas terpisah saat redesign bagian Kasir.

> **Catatan penting (dikoreksi)**: Tujuan "Buat Bahan" adalah absensi harian biasa (submit foto + lokasi, maksimal 1x per hari) yang menandai kasir bertugas untuk aktivitas produksi hari itu — **bukan** titik di mana eksekusi produksi (potong/tambah stok) benar-benar terjadi. Eksekusi produksi yang sesungguhnya (memilih resep, jumlah, memotong stok bahan dasar, menambah stok bahan hasil) terjadi di halaman terpisah **Bahan/Produksi Bahan** sisi Kasir (bagian 16), yang tidak dibatasi jumlah eksekusinya per hari. Kedua hal ini independen satu sama lain — lihat penjelasan lengkap & alasannya di bagian 16.5.

### 11.2 Struktur Data & Kolom Tabel

| Kolom | Sumber | Catatan |
|---|---|---|
| Karyawan | Nama + avatar inisial | — |
| Tanggal | Otomatis saat absen | — |
| Tujuan | Dipilih karyawan saat absen: `Shift 1` / `Shift 2` / `Buat Bahan` | Nama kolom **"Tujuan"** (bukan "Shift" seperti sempat dikoreksi sebelumnya) — karena mencakup 3 opsi, bukan cuma 2 jenis shift kerja |
| Jam Masuk | Timestamp otomatis saat absen | Hanya menampilkan jam, **tidak ada indikator "Tepat Waktu" / "Telat"** — keputusan final, fitur ini sengaja tidak diterapkan |
| Jam Keluar | Timestamp otomatis saat karyawan absen pulang | Dicatat untuk **pengawasan operasional** (misal karyawan pulang cepat tanpa izin) — **bukan** untuk kalkulasi gaji |
| Lokasi | **Otomatis oleh sistem**, dihitung dari radius jarak GPS ke koordinat resto (pakai Geolocation API) | Badge "✓ Sesuai" / "⚠ Tidak Sesuai" — admin tidak perlu mengecek manual untuk bagian ini |
| Foto | Foto selfie saat absen | Thumbnail di tabel, klik untuk buka modal detail dengan foto penuh |
| Status | `Valid` (default) / `Ditolak` | Ditentukan lewat review manual admin atas foto (lihat 11.3) |
| Aksi | Tombol "Tolak" (hanya muncul untuk entri berstatus Valid) | Entri yang sudah "Ditolak" tidak punya aksi lagi selain menampilkan alasan penolakan |

### 11.3 Validasi Foto — Manual oleh Admin, dengan Soft-Reject (bukan Hapus Permanen)

- **Foto tidak bisa divalidasi otomatis** (butuh penilaian manusia: apakah wajah jelas, apakah benar orangnya) — beda dari validasi Lokasi yang otomatis (11.2)
- Default status setiap absensi baru adalah **"Valid"** — admin tidak wajib me-review satu-satu setiap entri, cukup meninjau bila ada kecurigaan (misal badge Lokasi "Tidak Sesuai" muncul, atau foto terlihat mencurigakan di thumbnail)
- Jika admin menilai sebuah absensi **tidak valid**, gunakan tombol **"Tolak"** (bukan hapus permanen) — membuka form kecil meminta **alasan penolakan** (contoh: "Foto buram, tidak bisa dipastikan identitasnya")
- Setelah ditolak, status entri berubah jadi **"Ditolak"** dan datanya **tetap tersimpan** (baris tabel diberi warna berbeda) beserta alasannya — bukan dihapus dari sistem
- **Alasan keputusan ini**: konsisten dengan prinsip Log Aktivitas (bagian 8.4) — data yang berkaitan dengan akuntabilitas karyawan harus punya jejak audit. Kalau dihapus permanen dan terjadi perselisihan ("saya kok tidak dihitung hadir?"), admin tidak punya bukti alasan penolakannya
- *(Catatan fungsional untuk fase Kasir)*: saat sebuah absensi berstatus "Ditolak", karyawan perlu mendapat indikasi (misal notifikasi/badge saat login berikutnya di Kasir) bahwa absensi sebelumnya ditolak dan diminta mengulang

### 11.4 Hubungan dengan Gaji Karyawan

- **Gaji dihitung flat per absensi valid** (bukan per jam kerja) — keputusan ini dibuat untuk menyederhanakan kalkulasi payroll, menghindari kerumitan pembulatan menit atau perselisihan terkait keterlambatan
- Karena itu, **field Jam Masuk/Jam Keluar tidak dipakai untuk kalkulasi gaji** — keduanya murni untuk keperluan pengawasan operasional dan riwayat, bukan input matematis payroll
- Yang menentukan seseorang "dihitung hadir" untuk penggajian adalah status absensi = **Valid**. Absensi berstatus "Ditolak" tidak dihitung sebagai kehadiran
- Perhitungan gaji dipecah 2 komponen berdasarkan **Tujuan** dari absensi yang sama (lihat detail lengkap di bagian 12): absensi dengan Tujuan Shift 1/Shift 2 dihitung sebagai **Gaji Shift**, sedangkan absensi dengan Tujuan Buat Bahan dihitung sebagai **Gaji Produksi** — keduanya bersumber dari satu tabel Absensi yang sama, hanya dikelompokkan berbeda saat kalkulasi

### 11.5 Layout & Filter

- Filter utama: **rentang tanggal** (Dari — Sampai), sudah ada di desain awal, dipertahankan
- List ditampilkan sebagai **tabel** (Laptop & Tablet, kolom sesuai 11.2) dan **card list** (HP, ringkas dengan badge shift/lokasi/status)
- Modal Foto Absensi menampilkan: foto penuh, nama, tanggal & jam, shift, dan status lokasi GPS — **tidak lagi menampilkan konten yang salah/rusak** seperti pada build sebelumnya (lihat catatan bug di 11.6)

### 11.6 Catatan Perbaikan dari Build Sebelumnya (bug fixes)
- Modal "Foto Absensi" pada build sebelumnya menampilkan konten yang salah (teks penjelasan rumus statistik, bukan foto sungguhan) — harus dipastikan modal ini benar-benar merender foto yang tersimpan
- Thumbnail foto di kolom tabel juga sempat menampilkan konten rusak/tidak terbaca — kemungkinan root cause sama dengan bug modal di atas, perlu dicek bagaimana foto disimpan & di-render (format penyimpanan, path, atau komponen yang salah dipanggil)
- Kolom **"Lokasi"** yang sebelumnya menampilkan badge validasi umum (bukan data lokasi yang sebenarnya) sekarang benar-benar merepresentasikan hasil pengecekan GPS (lihat 11.2)
- Kolom **"Tujuan"** dipertahankan namanya (sempat dikoreksi jadi "Shift" di iterasi sebelumnya, lalu dikembalikan lagi) karena ternyata mencakup 3 opsi (Shift 1 / Shift 2 / Buat Bahan), bukan cuma 2 jenis shift kerja — lihat 11.2

---

## 12. Halaman Gaji Karyawan

> Status: ✅ Disetujui.

### 12.1 Konsep

Gaji dihitung berdasarkan data **Absensi Karyawan** (bagian 11) dalam periode (bulan) tertentu, dipecah jadi 2 komponen berdasarkan Tujuan absensi, ditambah komponen Bonus opsional:

| Komponen | Sumber Perhitungan |
|---|---|
| **Gaji Shift** | Jumlah absensi valid dengan Tujuan = Shift 1 atau Shift 2, dikali rate per shift |
| **Gaji Produksi** | Jumlah absensi valid dengan Tujuan = Buat Bahan, dikali rate per aktivitas produksi |
| **Bonus** | Nominal manual (opsional) + catatan alasan, diisi admin saat menghitung gaji |
| **Total Gaji** | Gaji Shift + Gaji Produksi + Bonus |

Kedua komponen pertama (Gaji Shift & Gaji Produksi) **bersumber dari tabel Absensi yang sama** — tidak ada tabel "Riwayat Produksi" terpisah (lihat koreksi di bagian 6.1 & 11.1).

### 12.2 Struktur Data & Form "Hitung Gaji"

| Field | Tipe Input | Catatan |
|---|---|---|
| Karyawan | Dropdown | Pilih dari daftar karyawan aktif |
| Periode (Bulan) | Month picker | Contoh: Agustus 2026 |
| Rate / Shift (Rp) | Number input | **Idealnya auto-terisi dari default rate di profil karyawan** (Manajemen Akun), tapi tetap bisa diubah manual untuk periode tertentu bila diperlukan |
| Rate Produksi / Kali (Rp) | Number input | Sama seperti di atas — auto-terisi dari default, bisa di-override |
| Bonus (Rp) | Number input, opsional | Default 0 jika tidak diisi |
| Catatan Bonus | Text input, opsional | Contoh: "Bonus kinerja Agustus" — hanya relevan jika Bonus diisi |

Jumlah shift valid dan jumlah aktivitas produksi **dihitung otomatis oleh sistem** dari data Absensi pada periode yang dipilih — admin tidak perlu menginput angka ini secara manual.

### 12.3 Tabel List Gaji

Kolom: Karyawan, Periode, Gaji Shift (nominal + formula), Gaji Produksi (nominal + formula), Bonus, Total Gaji, Status, Aksi.

### 12.4 Status Pembayaran (komponen baru, penting)

Setiap hasil kalkulasi gaji punya status:
- **Draft** — hasil kalkulasi awal, masih bisa dihitung ulang/disesuaikan, belum memengaruhi Pengeluaran
- **✓ Dibayar** — setelah admin menekan tombol **"Tandai Sudah Dibayar"**, status berubah permanen, baris menjadi terkunci (🔒, tidak bisa diedit lagi), dan **otomatis membuat entri baru di halaman Pengeluaran** dengan kategori "Gaji Karyawan" (read-only di sisi Pengeluaran) — sesuai keputusan di bagian 8.2 dan 9.2

### 12.5 Modal Detail Gaji

Menampilkan breakdown lengkap (Gaji Shift, Gaji Produksi, Bonus, Total Gaji) dan Status Pembayaran dengan tombol aksi bayar bila masih Draft.

**Keputusan desain**: modal ini **sengaja tidak menampilkan daftar/list riwayat absensi maupun riwayat produksi secara rinci** (baik dalam bentuk list maupun link ke halaman lain) — cukup angka ringkas di breakdown. Alasan: menghindari duplikasi tampilan yang memakan tempat; jika admin butuh detail per-tanggal, data itu sudah lengkap tersedia di halaman Absensi Karyawan (bagian 11) dengan filter nama karyawan.

### 12.6 Layout per Device

Mengikuti pola yang sama dengan modul-modul sebelumnya:

| Device | Layout List | Pola Hitung Gaji |
|---|---|---|
| Laptop | Tabel + sidebar | Modal dialog di tengah layar |
| Tablet | Tabel (mirip laptop) + Bottom Tab Bar | Modal dialog |
| HP | Card list (nama, periode, total, ringkasan komponen, status) + Bottom Tab Bar | Full-screen page (slide dari bawah) |

---

## 13. Halaman Manajemen Akun

> Status: ✅ Disetujui.

### 13.1 Konsep — Akun Kasir Juga Berperan sebagai Profil Karyawan

Selain fungsi standar (login, role), akun berperan sebagai **profil karyawan** yang menyimpan rate gaji default (Rate/Shift & Rate Produksi/Kali) — nilai ini otomatis menjadi default saat admin membuka form "Hitung Gaji" di halaman Gaji Karyawan (bagian 12.2), sehingga tidak perlu diinput ulang setiap bulan.

### 13.2 Aturan Role

- **Akun baru hanya bisa dibuat dengan role Kasir** — field Role di form Tambah Akun bersifat locked/disabled, tidak bisa dipilih manual
- *(Asumsi yang perlu dikonfirmasi lebih lanjut jika kebutuhan berubah)*: sistem saat ini didesain untuk **1 akun Admin permanen**. Jika ke depannya dibutuhkan akun Admin kedua (misal partner bisnis), itu memerlukan jalur pembuatan akun terpisah yang lebih diproteksi — belum termasuk dalam scope desain saat ini
- **Akun Admin tidak memiliki aksi Hapus maupun Nonaktifkan** — hanya bisa diedit datanya, mencegah admin terkunci dari sistemnya sendiri

### 13.3 Struktur Data Form

**Tambah Akun Kasir:**

| Field | Tipe Input | Catatan |
|---|---|---|
| Nama Lengkap | Text input | — |
| Username | Text input | — |
| Password | Password input (dengan toggle show/hide) | Min. 6 karakter |
| Konfirmasi Password | Password input | Wajib sama dengan Password — mencegah typo yang baru ketahuan saat karyawan gagal login |
| Role | Text, disabled, terisi "KASIR" | Tidak bisa diubah (lihat 13.2) |
| Rate / Shift (Rp) | Number input | Default rate gaji per shift untuk karyawan ini |
| Rate Produksi / Kali (Rp) | Number input | Default rate gaji per aktivitas produksi bahan untuk karyawan ini |

**Edit Akun** — hanya berisi Nama Lengkap, Username, Role (read-only), Rate/Shift, dan Rate Produksi/Kali. **Tidak ada field password** di form ini — mengganti password dilakukan lewat aksi terpisah (lihat 13.4).

### 13.4 Reset Password — Aksi Terpisah dari Edit Data

Tombol 🔑 di tabel membuka modal khusus berisi **Password Baru** + **Konfirmasi Password Baru** (tanpa menampilkan/meminta password lama). Dipisahkan dari form Edit Data biasa mengikuti prinsip keamanan standar (mengubah kredensial adalah aksi sensitif yang sebaiknya punya jalur & konfirmasi sendiri, terpisah dari update data profil biasa).

### 13.5 Nonaktifkan Akun (Kasir) — Bukan Hapus Permanen

Akun Kasir **tidak memiliki opsi hapus permanen**. Sebagai gantinya, tersedia aksi **⛔ Nonaktifkan**:
- Membuka modal konfirmasi yang menjelaskan konsekuensinya: akun tidak bisa login lagi, tapi seluruh riwayat (Absensi, Gaji, Transaksi) yang pernah dibuat akun tersebut **tetap tersimpan utuh**
- Akun berstatus Nonaktif ditampilkan dengan visual berbeda (baris/kartu diredupkan) di tabel/list, dan bisa **diaktifkan kembali kapan saja** lewat aksi yang sama (berubah jadi "✓ Aktifkan")

**Alasan keputusan ini**: konsisten dengan prinsip yang sudah diterapkan di beberapa modul lain dalam dokumen ini (Absensi — soft-reject bukan hapus, bagian 11.3; Pengeluaran — entri terkunci bukan dihapus, bagian 9.2) — data yang terhubung dengan riwayat/akuntabilitas seseorang sebaiknya tidak dihapus permanen, karena berisiko menjadi data yatim (orphan) yang merusak integritas laporan historis (Gaji, Absensi, Laporan Keuangan) yang mereferensikan akun tersebut.

### 13.6 Layout per Device

Mengikuti pola yang sama dengan modul-modul sebelumnya:

| Device | Layout List | Pola Tambah Akun |
|---|---|---|
| Laptop | Tabel + sidebar | Modal dialog di tengah layar |
| Tablet | Tabel (mirip laptop) + Bottom Tab Bar | Modal dialog |
| HP | Card list (nama, username, role, rate ringkas) + Bottom Tab Bar | Full-screen page (slide dari bawah); aksi Edit/Reset Password/Nonaktifkan lewat Bottom Sheet |

---

# Bagian II — Sisi Kasir

> Device utama Kasir: **50:50 antara HP dan Tablet** (tidak bisa diasumsikan salah satu) — berbeda dari Admin yang mayoritas HP/Tablet dengan laptop jarang dipakai. Karena itu, desain Kasir dibuat untuk bekerja baik di HP maupun Tablet dengan pola navigasi yang **sama** di keduanya (tidak ada perbedaan pola sidebar vs bottom tab seperti di sisi Admin).

## 14. Navigasi Global Kasir

### 14.1 Perubahan dari Build Sebelumnya

Build sebelumnya memakai **sidebar permanen** (mirip pola Laptop Admin) berisi 4 menu + status Printer + profil user + Logout menempel selamanya di layar. Pola ini **diganti total** karena:
- Sidebar permanen boros ruang di HP (device Kasir 50% kemungkinan besar adalah HP)
- Konsisten dengan keputusan besar produk ini: navigasi mobile-first pakai Bottom Tab Bar (sama seperti sisi Admin, bagian 2.2)

### 14.2 Bottom Tab Bar Kasir — Tanpa Slot "Lainnya"

Berbeda dari Admin yang punya 9 menu (butuh slot "Lainnya" untuk overflow, bagian 2.2), **Kasir hanya punya 4 menu** sehingga semuanya muat langsung tanpa overflow:

1. 🛒 Transaksi
2. 🧂 Bahan
3. 📜 Riwayat (Hari Ini)
4. 🗓️ Absensi

Pola visual tab (icon + label, state aktif dengan background `--primary-glow`) mengikuti spesifikasi Bottom Tab Bar yang sama seperti Admin (bagian 2.2), hanya isinya beda dan tanpa slot ke-5.

### 14.3 Printer & Logout — Dipindah ke Sheet Profil

Karena sidebar dihapus, status koneksi Printer (Bluetooth) dan tombol Logout yang sebelumnya menempel di sidebar dipindah ke **sheet kecil** yang muncul saat ikon profil (lingkaran inisial nama) di pojok kanan-atas tiap halaman di-tap. Sheet ini berisi:
- Nama & role user yang login
- Status koneksi Printer (dot indikator + label "Terhubung"/"Tidak Terhubung") dan tombol "Hubungkan Printer" bila belum terhubung
- Tombol Logout (warna merah/`--danger`, dipisah visual dari elemen lain)

---

## 15. Halaman Transaksi (Kasir)

> Status: ✅ Disetujui.

### 15.1 Konsep

Menampilkan seluruh menu yang sudah diinput admin di **Manajemen Menu** (bagian 7), dikelompokkan per kategori, untuk dipilih dan diproses jadi transaksi penjualan.

### 15.2 Filter Kategori — Tanpa Opsi "Semua"

Chip filter kategori hanya berisi 3 opsi tetap: **🍔 Makanan**, **🥤 Minuman**, **🍿 Snack** (sesuai kategori fixed dari Manajemen Menu, bagian 7.2) — **chip "Semua" sengaja dihapus**, kasir harus selalu berada di salah satu kategori (default: Makanan aktif saat halaman dibuka).

### 15.3 Kartu Menu

Tiap kartu menampilkan: foto, nama, harga — bersumber langsung dari data Manajemen Menu. Menu dengan status **"Stok Tidak Cukup"** (dihitung otomatis, lihat bagian 7.3) tampil **redup/disabled dengan badge "Habis"**, tidak bisa diklik/ditambahkan ke pesanan. Ini adalah penerapan nyata dari logic auto-disable yang sudah dirancang di Manajemen Menu — kasir tidak perlu tahu alasan detailnya, sistem yang mencegah menu itu terjual.

### 15.4 Panel/Halaman Pesanan (Keranjang)

Berisi: daftar item yang dipilih (dengan pengatur kuantitas +/−), field **Diskon** (nominal Rp atau persen), pilihan **Metode Pembayaran** (Cash / QRIS / Grab / GoFood — konsisten dengan breakdown pembayaran di Laporan, bagian 10.3), ringkasan Subtotal–Diskon–Total, dan tombol Bayar (dengan shortcut keyboard F2 untuk device yang mendukung keyboard/tablet dengan aksesori).

### 15.5 Perbedaan Layout HP vs Tablet

| Device | Perilaku Panel Pesanan |
|---|---|
| **Tablet** | Panel Pesanan tampil **permanen di sisi kanan**, sejajar dengan grid menu — layar cukup lebar untuk menampilkan keduanya sekaligus tanpa berpindah halaman |
| **HP** | Pesanan **disembunyikan sebagai cart bar mengambang** di atas Bottom Tab Bar (menampilkan jumlah item + total), muncul otomatis begitu ada item ditambahkan. Tap cart bar membuka **halaman Pesanan full-screen** (slide dari bawah, ada tombol back) berisi seluruh detail (item, diskon, metode pembayaran, ringkasan, tombol Bayar) |

Alasan perbedaan: layar HP tidak cukup lebar untuk menampilkan grid menu dan panel pesanan bersamaan tanpa terasa sempit, sehingga pesanan disembunyikan sampai dibutuhkan — pola yang sama dengan konsep "cart" di aplikasi e-commerce mobile pada umumnya.

---

## 16. Halaman Bahan / Produksi Bahan (Kasir)

> Status: ✅ Disetujui — termasuk model hubungan dengan Absensi yang sudah dikonfirmasi (lihat 16.5, direvisi).

### 16.1 Konsep

Halaman tempat kasir **mengeksekusi produksi** bahan olahan berdasarkan resep yang sudah didefinisikan admin di **Pembuatan Bahan** (bagian 6). Menampilkan grid kartu resep yang bisa dipilih, lalu modal konfirmasi untuk menentukan jumlah produksi sebelum stok benar-benar dipotong/ditambah.

### 16.2 Kartu Resep — Validasi Stok Otomatis

Setiap kartu resep menampilkan: nama, badge hasil (`→ [Bahan Hasil]`), dan ringkasan komposisi bahan dasar. Sistem otomatis mengecek apakah **seluruh bahan dasar** dalam resep tersebut cukup untuk minimal 1x produksi:
- Jika cukup → kartu aktif, bisa diklik
- Jika ada 1 saja bahan dasar yang tidak cukup → kartu diberi badge **"⚠️ Stok Kurang"** dan **dinonaktifkan** (tidak bisa dibuka)

Mengikuti pola auto-disable yang sama seperti pada Manajemen Menu (bagian 7.3).

### 16.3 Modal "Konfirmasi Produksi"

Berisi:
- Nama resep + badge bahan hasil
- Daftar bahan dasar yang terpakai per 1x produksi (ditampilkan sebagai pengurangan, misal "Latam -16 gram") diakhiri baris hasil (misal "Hasil: BS +1 pcs")
- Field **Jumlah Produksi** dengan stepper (+/−) dan input angka langsung
- **Validasi otomatis**: jumlah maksimal dihitung dari bahan dasar yang paling membatasi (stok tersisa ÷ kebutuhan per produksi), ditampilkan sebagai hint (contoh: "Maksimal 2x produksi — dibatasi stok Latam"). Jika kasir mengetik jumlah melebihi batas ini, muncul peringatan dan tombol Konfirmasi otomatis nonaktif
- Ringkasan real-time yang mengalikan seluruh komposisi sesuai Jumlah Produksi yang diinput, diperbarui langsung saat angka diubah
- Tombol Batal dan Konfirmasi Produksi

### 16.4 Riwayat Produksi Hari Ini — Penamaan Disesuaikan

Panel/link yang menampilkan riwayat produksi pada hari berjalan diberi nama **"Riwayat Produksi Hari Ini"** — sengaja dibedakan dari tab **"Riwayat Hari Ini"** di Bottom Tab Bar (bagian 14.2) yang merujuk pada riwayat transaksi penjualan. Kedua fitur ini berbeda konteks meski nama aslinya sempat sama-sama "Riwayat Hari Ini", berpotensi membingungkan kasir jika tidak dibedakan.

### 16.5 Hubungan dengan Absensi & Gaji Produksi (DIKOREKSI — sudah dikonfirmasi)

> **Koreksi dari draft sebelumnya**: draft awal dokumen ini sempat berasumsi bahwa "Konfirmasi Produksi" otomatis membuat entri Absensi "Buat Bahan". Setelah melihat alur Absensi Kasir yang sesungguhnya (bagian 18), asumsi itu **salah** dan sudah dikoreksi di bawah ini.

**Model yang benar — Absensi dan eksekusi produksi bersifat independen (decoupled)**:
- **Absensi "Buat Bahan"** (bagian 18) adalah aksi **manual terpisah**: kasir membuka halaman Absensi, memilih Tujuan "Buat Bahan", mengambil foto + lokasi, lalu mengirim — persis seperti alur absen Shift 1/Shift 2. Sama seperti kedua Tujuan lainnya, **hanya bisa dikirim 1x per hari** untuk Tujuan yang sama.
- **Eksekusi produksi di halaman ini (Bahan)** adalah aktivitas operasional yang **tidak dibatasi jumlahnya per hari** — kasir bisa mengonfirmasi produksi beberapa resep berbeda (atau resep yang sama berkali-kali, selama stok cukup) dalam satu hari kerja, terlepas dari sudah/belum absen "Buat Bahan" hari itu.
- Kedua hal ini **tidak saling memicu otomatis** — mengonfirmasi produksi tidak membuat entri Absensi, dan mengirim Absensi "Buat Bahan" tidak otomatis mencatat produksi apapun.

**Implikasi untuk Gaji Produksi (bagian 12.1)**: jumlah "kali produksi" yang dipakai untuk menghitung komponen Gaji Produksi dihitung dari **jumlah entri Absensi valid dengan Tujuan "Buat Bahan"** (maksimal 1 per hari, sama seperti cara Gaji Shift dihitung dari Shift 1/Shift 2) — **bukan** dari jumlah aktivitas eksekusi produksi resep yang sebenarnya bisa terjadi berkali-kali dalam sehari. Dengan kata lain, Absensi "Buat Bahan" berfungsi sebagai penanda "hari ini saya bertugas produksi" (dibayar flat per hari kerja produksi, sama seperti shift), sedangkan halaman Bahan adalah tempat eksekusi teknis yang tidak punya hubungan pembayaran langsung dengan berapa kali resep dijalankan.

### 16.6 Layout per Device

| Device | Layout |
|---|---|
| Tablet | Grid kartu resep (multi-kolom) di kiri + panel "Riwayat Produksi Hari Ini" permanen di kanan — layar cukup lebar untuk menampilkan keduanya sekaligus |
| HP | Grid kartu resep (2 kolom) full width; link ringkas "📋 Riwayat Produksi Hari Ini" di atas grid (menampilkan jumlah produksi hari ini) yang saat di-tap membuka bottom sheet berisi daftar riwayat |

Modal "Konfirmasi Produksi" tampil sebagai bottom sheet (slide dari bawah) di kedua device, mengingat kontennya cukup panjang (komposisi + stepper + ringkasan) sehingga bottom sheet memberi ruang vertikal yang lebih leluasa dibanding modal dialog di tengah layar.

---

## 17. Halaman Riwayat Hari Ini (Transaksi Penjualan — Kasir)

> Status: ✅ Tidak ada perubahan dari rencana awal — dikonfirmasi tidak perlu redesign khusus.

Menampilkan riwayat transaksi penjualan (bukan produksi — lihat pembeda penamaan di 16.4) yang terjadi pada hari berjalan, dari sudut pandang kasir yang sedang login. Struktur data mengikuti pola transaksi yang sudah dirancang di bagian 15 (Transaksi) dan bagian 10.4 (breakdown per shift di Laporan sisi Admin) — setiap transaksi menampilkan waktu, item yang dibeli, metode pembayaran, dan total. Tidak ada catatan desain tambahan untuk halaman ini di luar yang sudah mengikuti pola umum modul-modul lain dalam dokumen ini (Bottom Tab Bar, profil sheet, dst — bagian 14).

---

## 18. Halaman Absensi (Kasir)

> Status: ✅ Disetujui.

### 18.1 Konsep

Halaman tempat kasir mengirim absensi harian untuk salah satu dari 3 Tujuan (🌅 Shift 1, 🌙 Shift 2, 🧪 Buat Bahan — bagian 11.2), dengan verifikasi foto selfie dan lokasi GPS. Setiap Tujuan **hanya bisa dikirim 1 kali per hari**.

### 18.2 Status Absensi Hari Ini

Panel ringkasan di atas menampilkan status ketiga Tujuan untuk hari berjalan — masing-masing ditandai ✓ (sudah dikirim) atau ✕ (belum). Panel ini murni informasi, tidak interaktif.

### 18.3 Pemilihan Tujuan — Terkunci Setelah Terkirim

Chip Tujuan Absensi menampilkan ketiga opsi. Begitu satu Tujuan sudah berhasil dikirim untuk hari itu:
- Chip tersebut berubah tampilan (dicoret/redup) dan **tidak bisa diklik lagi**
- Tujuan lain yang belum dikirim tetap bisa dipilih seperti biasa

Mencegah kasir mengirim absensi ganda untuk Tujuan yang sama dalam satu hari.

### 18.4 Foto — Wajib Live Capture, Tidak Boleh dari Galeri

**Perubahan penting dari build sebelumnya**: form lama menggunakan file picker biasa ("Pilih Foto" dengan ikon folder), yang memungkinkan kasir mengunggah foto lama dari galeri alih-alih mengambil foto secara langsung saat itu. Ini melemahkan tujuan verifikasi identitas.

**Keputusan baru**: tombol foto **wajib membuka kamera perangkat secara langsung** (live capture menggunakan HTML5 Media Capture API, sesuai tech stack yang sudah ada), bukan file browser. Setelah foto diambil, tampil preview + opsi "Ambil Ulang" untuk retake bila hasil kurang baik.

### 18.5 Lokasi — Validasi Radius Real-Time

- Tombol "Ambil Lokasi Sekarang" memicu Geolocation API untuk menangkap koordinat kasir saat itu
- Sistem langsung menghitung jarak ke koordinat resto (fixed) dan menampilkan hasil validasi **seketika**, sebelum kasir mencoba kirim:
  - **✓ Dalam radius** (hijau) — jika jarak ≤ **100 meter** dari lokasi resto
  - **✗ Di luar radius** (merah) — jika jarak > 100 meter, disertai info jarak sebenarnya
- Radius maksimal 100 meter ini adalah nilai tetap yang menentukan validitas lokasi absensi

### 18.6 Tombol Kirim Absensi

- **Nonaktif** (abu-abu) selama salah satu dari 2 syarat belum terpenuhi: foto belum diambil, atau lokasi belum valid (di luar radius/belum diambil)
- **Aktif** (hijau) begitu foto sudah diambil DAN lokasi dalam radius
- Label tombol otomatis mengikuti Tujuan yang sedang dipilih (contoh: "Kirim Absensi Shift 2")

### 18.7 Layout per Device

Struktur sama antara HP dan Tablet (status panel di atas, lalu Tujuan, Foto, Lokasi, tombol Kirim) — hanya Tablet menyusun section Foto dan Tujuan/Lokasi berdampingan (2 kolom) karena layar lebih lebar, sedangkan HP menumpuknya vertikal.

---

*Dokumen ini akan terus di-update setiap kali kita selesai membahas & redesign fitur baru (alur login Kasir, dst). Simpan versi terbaru sebagai satu sumber kebenaran (single source of truth) untuk di-copy ke AI Agent pembuat website.*
