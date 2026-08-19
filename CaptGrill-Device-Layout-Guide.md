# CaptGrill — Panduan Tata Letak Device (HP & Tablet)

> Dokumen pendamping dari **CaptGrill-Design-Spec.md**. Isinya murni fokus ke dimensi **tata letak per device** (HP dan Tablet) dari seluruh halaman yang sudah didesain — supaya bisa jadi rujukan cepat tanpa perlu baca ulang spec lengkap tiap halaman. Untuk detail field, logic, dan alasan keputusan di balik tiap halaman, tetap rujuk ke dokumen spec utama.

---

## 1. Strategi Device — Ringkasan

| | Admin | Kasir |
|---|---|---|
| Device utama | HP & Tablet (mayoritas), Laptop jarang dipakai | **50:50 HP & Tablet** — Laptop tidak dipakai sama sekali |
| Pola navigasi | **Sidebar** di Laptop, **Bottom Tab Bar** di HP/Tablet | **Bottom Tab Bar** di HP maupun Tablet (sama persis di keduanya) |
| Jumlah menu | 9 menu → Bottom Tab Bar butuh slot "Lainnya" (overflow) | 4 menu → semua muat langsung, **tanpa** slot "Lainnya" |
| Akun/Logout | Menempel di footer Sidebar (Laptop); dalam Bottom Sheet "Lainnya" (HP/Tablet) | Ikon profil bulat pojok kanan-atas tiap halaman → buka sheet kecil (Printer + Logout) |

---

## 2. Navigasi Global

### 2.1 Admin — Bottom Tab Bar (HP & Tablet)
5 slot: **Dashboard, Manajemen Bahan, Kasir\*, Laporan, Lainnya**.
*(\*catatan: slot ke-3 "Kasir" pada desain awal merujuk ke shortcut operasional; sesuaikan bila perlu shortcut lain yang lebih relevan untuk admin)*
Tap "Lainnya" → Bottom Sheet berisi: Manajemen Menu, Pembuatan Bahan, Pengeluaran, Absensi Karyawan, Gaji Karyawan, Manajemen Akun, Logout (dipisah warna merah).

### 2.2 Kasir — Bottom Tab Bar (HP & Tablet, identik)
4 slot langsung tanpa overflow: **🛒 Transaksi, 🧂 Bahan, 📜 Riwayat Hari Ini, 🗓️ Absensi**.
Printer & Logout dipindah ke sheet profil (ikon bulat kanan-atas), bukan di tab bar.

---

## 3. Tata Letak per Halaman — Sisi Admin

### 3.1 Dashboard
| Device | Tata Letak |
|---|---|
| HP | Stat card (Transaksi, Pemasukan) 2 kolom sejajar → Grafik Keuangan (axis disembunyikan, ringkas) → Menu Terlaris (full width) → Stok Menipis (full width, di bawah Menu Terlaris) |
| Tablet | Sama seperti HP (stat card tetap 2 kolom, Menu Terlaris & Stok Menipis tetap ditumpuk vertikal bukan sejajar) — hanya ukuran elemen lebih lega |

### 3.2 Manajemen Bahan
| Device | Tata Letak |
|---|---|
| HP | Card list (bukan tabel) dikelompokkan per kategori, filter kategori jadi chip geser horizontal, FAB (+) mengambang untuk tambah bahan → membuka **halaman penuh** (full-screen, slide dari bawah) |
| Tablet | **Tabel penuh** (mirip Laptop — kolom Nama/Satuan/Stok/Min/Status/Aksi), Tambah Bahan via **side panel/drawer dari kanan** (~45% lebar layar), Edit/Restock/Salin Catatan tetap modal dialog di tengah |

### 3.3 Pembuatan Bahan
| Device | Tata Letak |
|---|---|
| HP | Card list resep (nama hasil + tag komposisi), FAB (+) → halaman penuh untuk Tambah Resep dengan combobox searchable |
| Tablet | Tabel (mirip Laptop), Tambah Resep via side panel dari kanan; Edit Resep tetap modal dialog |

### 3.4 Manajemen Menu
| Device | Tata Letak |
|---|---|
| HP | Grid kartu foto menu **2 kolom**, filter kategori fixed (chip Makanan/Minuman/Snack), FAB (+) → halaman penuh untuk Tambah Menu |
| Tablet | Grid kartu foto menu **3 kolom** (mirip Laptop), Tambah Menu via side panel dari kanan |

### 3.5 Pengeluaran
| Device | Tata Letak |
|---|---|
| HP | Ringkasan total (card gradient hijau) di atas → card list pengeluaran (baris "Gaji Karyawan" tampil redup + terkunci 🔒) → FAB (+) buka **halaman penuh** |
| Tablet | Tabel (mirip Laptop) + ringkasan total; Tambah Pengeluaran cukup **modal dialog** (bukan side panel — formnya sederhana, tidak perlu ruang lebar) |

### 3.6 Laporan
| Device | Tata Letak |
|---|---|
| HP | Filter tanggal & tombol ditumpuk vertikal, 3 kartu ringkasan ditumpuk 1 kolom, 4 kartu metode pembayaran grid 2 kolom, section Transaksi (filter shift chip) & Pengeluaran tetap list vertikal |
| Tablet | Sama seperti Laptop — filter horizontal, kartu ringkasan & pembayaran tetap sejajar bila muat di layar |

*(Halaman ini view-only, tidak ada modal tambah/edit — jadi tidak ada perbedaan pola "tambah data" antar device)*

### 3.7 Absensi Karyawan
| Device | Tata Letak |
|---|---|
| HP | Card list absensi (foto thumbnail + badge shift/lokasi/status), tap kartu → modal foto detail muncul sebagai bottom sheet |
| Tablet | Tabel (mirip Laptop: Karyawan/Tanggal/Tujuan/Jam/Lokasi/Foto/Status/Aksi) |

### 3.8 Gaji Karyawan
| Device | Tata Letak |
|---|---|
| HP | Card list gaji per karyawan (nama, periode, total, status Draft/Dibayar), tap → modal Detail Gaji sebagai bottom sheet berisi breakdown + tombol Bayar |
| Tablet | Tabel (mirip Laptop), Hitung Gaji via modal dialog |

### 3.9 Manajemen Akun
| Device | Tata Letak |
|---|---|
| HP | Card list akun (nama, username, role, rate ringkas), FAB (+) → halaman penuh Tambah Akun; aksi Edit/Reset Password/Nonaktifkan lewat Bottom Sheet per akun |
| Tablet | Tabel (mirip Laptop: Username/Nama/Role/Rate/Status/Aksi), Tambah Akun via modal dialog |

---

## 4. Tata Letak per Halaman — Sisi Kasir

> Ingat: Kasir **tidak punya versi Laptop sama sekali**. Semua di bawah ini hanya HP vs Tablet.

### 4.1 Transaksi
| Device | Tata Letak |
|---|---|
| HP | Chip kategori (Makanan/Minuman/Snack, tanpa "Semua") → grid menu 2 kolom → **cart bar mengambang** di atas Bottom Tab Bar (muncul otomatis saat ada item), tap → **halaman Pesanan penuh** (item, diskon, metode bayar, ringkasan, tombol Bayar) |
| Tablet | Chip kategori sama → grid menu (kiri, lebih banyak kolom) + **panel Pesanan permanen di kanan** (sejajar, tidak perlu buka halaman terpisah) |

### 4.2 Bahan (Produksi Bahan)
| Device | Tata Letak |
|---|---|
| HP | Link ringkas "📋 Riwayat Produksi Hari Ini (jumlah)" di atas → grid kartu resep 2 kolom (badge "⚠️ Stok Kurang" jika tidak bisa diproduksi) → tap kartu → modal "Konfirmasi Produksi" sebagai **bottom sheet** |
| Tablet | Grid kartu resep multi-kolom (kiri) + panel **"Riwayat Produksi Hari Ini" permanen di kanan** (sejajar) |

### 4.3 Riwayat Hari Ini (Transaksi Penjualan)
| Device | Tata Letak |
|---|---|
| HP | List riwayat transaksi vertikal, mengikuti pola card list standar (waktu, item, metode bayar, total) |
| Tablet | Sama seperti HP, hanya ukuran elemen lebih lega — tidak ada perbedaan struktural khusus |

### 4.4 Absensi (Kasir)
| Device | Tata Letak |
|---|---|
| HP | Ditumpuk vertikal: Status Absensi Hari Ini (3 kolom mini) → Tujuan Absensi (chip) → Foto (kamera) → Lokasi (tombol + hasil validasi) → tombol Kirim |
| Tablet | Status Absensi Hari Ini tetap di atas (full width) → section **Foto** dan **Tujuan+Lokasi** disusun **2 kolom berdampingan** → tombol Kirim di bawah |

---

## 5. Pola Umum yang Berulang di Semua Halaman

Supaya konsisten saat implementasi, berikut pola yang dipakai berulang lintas halaman (Admin maupun Kasir):

| Pola | Kapan Dipakai |
|---|---|
| **Full-screen page** (slide dari bawah, tombol back) | Form "Tambah Data" di HP untuk halaman dengan field kompleks (Manajemen Bahan, Pembuatan Bahan, Manajemen Menu, Manajemen Akun, Pesanan Kasir) |
| **Side panel / drawer dari kanan** (~45% lebar layar) | Form "Tambah Data" di Tablet untuk halaman dengan field kompleks — list tetap terlihat di belakang sebagai konteks |
| **Modal dialog di tengah** | Form sederhana (Pengeluaran, Hitung Gaji) di Tablet; semua form di Laptop (Admin) |
| **Bottom Sheet** | Aksi cepat per-item (Edit/Restock/Hapus di Manajemen Bahan HP; Edit/Reset Password/Nonaktifkan di Manajemen Akun HP); modal dengan konten panjang (Konfirmasi Produksi Kasir) |
| **Card list** menggantikan tabel | Semua halaman list-data di HP (tabel dianggap terlalu sempit untuk layar kecil) |
| **Tabel penuh mirip Laptop** | Semua halaman list-data di Tablet (layar cukup lebar untuk kolom tabel) |

---

*Dokumen ini adalah turunan dari CaptGrill-Design-Spec.md, fokus khusus pada dimensi device. Update dokumen ini mengikuti setiap perubahan pada spec utama.*
