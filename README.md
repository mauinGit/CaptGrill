# 📄 Product Requirements Document (PRD)

# Sistem Informasi Manajemen Penjualan CaptGrill

---

## 1. Latar Belakang

CaptGrill merupakan usaha kuliner yang menjual makanan western seperti kebab, burger, dan minuman. Saat ini proses pencatatan transaksi, stok bahan, laporan pemasukan dan pengeluaran, serta absensi karyawan masih dilakukan secara manual sehingga:

* Rentan terjadi kesalahan pencatatan
* Sulit memantau stok bahan
* Laporan keuangan tidak terstruktur
* Penggajian karyawan membutuhkan perhitungan manual

Oleh karena itu diperlukan sebuah sistem berbasis website fullstack untuk meningkatkan efektivitas dan efisiensi operasional CaptGrill.

---

## 2. Tujuan Sistem

Membangun sistem berbasis web menggunakan Next.js dan database MySQL (phpMyAdmin via Laragon) yang mampu:

1. Mengelola transaksi penjualan secara digital.
2. Mengelola stok bahan secara otomatis.
3. Menyediakan laporan pemasukan dan pengeluaran.
4. Menyediakan grafik keuangan real-time.
5. Mengelola absensi karyawan dan perhitungan gaji.
6. Mengatur hak akses berdasarkan peran (Admin dan Kasir).

---

## 3. Ruang Lingkup Sistem

### 3.1 Platform

* Web Application (Browser)
* Backend API
* Database MySQL (phpMyAdmin Laragon)
* Integrasi Bluetooth Printer

### 3.2 Role Pengguna

* Admin
* Kasir

---

## 4. Fitur Utama Sistem

---

## 4.1 Sistem Login & Role Management

### Deskripsi

Sistem menyediakan autentikasi pengguna dan pengalihan halaman sesuai peran.

### Fitur

* Login dengan username & password
* Validasi akun
* Redirect sesuai role (Admin / Kasir)
* Logout
* Manajemen akun kasir oleh Admin
* Reset password

---

## 4.2 Modul Kasir

### 4.2.1 Transaksi Penjualan

**Deskripsi:**
Kasir dapat memilih menu makanan/minuman, melakukan konfirmasi pembayaran, dan mencetak struk menggunakan Bluetooth printer.

**Fitur:**

* Pilih menu
* Tambah jumlah item
* Hitung total harga otomatis
* Halaman konfirmasi transaksi
* Cetak struk via Bluetooth
* Indikator status koneksi Bluetooth
* Diskon dan promo
* Pending transaksi

---

### 4.2.2 Riwayat Transaksi Harian

**Deskripsi:**
Kasir hanya dapat melihat transaksi pada hari yang sama.

**Fitur:**

* Daftar transaksi hari ini
* Detail menu yang dibeli
* Tidak dapat melihat transaksi hari sebelumnya

---

### 4.2.3 Absensi Kasir

**Deskripsi:**
Kasir melakukan absensi dengan mengisi nama, mengambil foto, dan validasi lokasi maksimal 500 meter dari toko.

**Fitur:**

* Form absensi
* Kamera web
* GPS location validation
* Penyimpanan tanggal dan jam absensi
* Validasi satu kali absensi per hari

---

## 4.3 Modul Admin

---

### 4.3.1 Manajemen Bahan

**Fitur:**

* Tambah bahan
* Edit bahan
* Hapus bahan
* Tentukan satuan
* Tentukan stok minimum
* Low stock alert

---

### 4.3.2 Manajemen Menu

**Fitur:**

* Tambah menu
* Tentukan harga
* Hubungkan menu dengan bahan (komposisi)
* Hapus menu
* Auto disable menu jika bahan habis

---

### 4.3.3 Otomatis Pengurangan Stok

Jika terjadi transaksi penjualan, stok bahan akan otomatis berkurang sesuai komposisi menu.

---

### 4.3.4 Manajemen Absensi & Gaji

**Fitur:**

* Lihat riwayat absensi kasir
* Filter berdasarkan tanggal
* Perhitungan gaji otomatis
* Data gaji hanya muncul setelah 30 hari

---

### 4.3.5 Manajemen Pengeluaran

**Kategori Pengeluaran:**

* Pembelian bahan
* Peralatan
* Listrik
* Lainnya

**Fitur:**

* Tambah pengeluaran
* Pilih kategori
* Input nominal
* Input tanggal

---

### 4.3.6 Laporan Pemasukan & Pengeluaran

**Fitur:**

* Filter tanggal
* Total pemasukan
* Total pengeluaran
* Laba / rugi

---

### 4.3.7 Grafik Keuangan

**Fitur:**

* Line chart / bar chart
* Realtime update
* Filter tanggal

---

### 4.3.8 Export Data

**Fitur:**

* Export Excel
* Export PDF
* Data transaksi
* Data pengeluaran
* Data absensi

---

### 4.3.9 Log Aktivitas (Audit Log)

**Fitur:**

* Catat aktivitas admin dan kasir
* Log edit, hapus, tambah data

---

## 5. User Experience (UX)

**Fitur tambahan:**

* Dark mode / light mode
* Shortcut keyboard kasir
* Search dan filter data
* Responsive (laptop, tablet, HP)

---

## 6. Kebutuhan Non-Fungsional

| Aspek          | Kebutuhan            |
| -------------- | -------------------- |
| Keamanan       | Password terenkripsi |
| Performance    | Respon < 3 detik     |
| Usability      | UI mudah digunakan   |
| Compatibility  | Chrome / Edge        |
| Database       | MySQL                |
| Backup         | Backup otomatis      |
| Error Handling | Notifikasi error     |

---

## 7. Teknologi yang Digunakan

| Layer           | Teknologi                  |
| --------------- | -------------------------- |
| Frontend        | Next.js                    |
| Backend API     | Node.js / Next API Route   |
| Database        | MySQL (phpMyAdmin Laragon) |
| Auth            | JWT / Session              |
| Chart           | Chart.js / Recharts        |
| Export Excel    | SheetJS                    |
| Bluetooth Print | Web Bluetooth API          |
| Location        | Geolocation API            |
| Camera          | Web Camera API             |

---

## 8. Entitas Data

**Tabel utama:**

* users
* menus
* ingredients
* menu_ingredients
* transactions
* transaction_details
* expenses
* attendance
* salary
* logs

---

## 9. Use Case Summary

### Kasir

* Login
* Input transaksi
* Cetak struk
* Riwayat transaksi hari ini
* Absensi

### Admin

* Kelola bahan
* Kelola menu
* Lihat laporan
* Kelola pengeluaran
* Export data
* Pantau grafik
* Kelola absensi & gaji

---

## 10. Batasan Sistem

* Sistem hanya digunakan internal CaptGrill
* Bluetooth printer harus kompatibel
* Validasi lokasi menggunakan GPS browser
* Tidak mendukung transaksi offline penuh

---

## 11. Indikator Keberhasilan

* Transaksi tercatat otomatis
* Stok bahan berkurang otomatis
* Laporan dapat di-generate
* Absensi terekam dengan foto & lokasi
* Grafik tampil real-time
* Export data berhasil

---

## 12. Roadmap Pengembangan

### Fase 1 (MVP)

* Login
* Kasir transaksi
* Stok bahan
* Laporan dasar

### Fase 2

* Absensi
* Grafik
* Export Excel
* Diskon & promo

### Fase 3 (Advanced)

* Backup otomatis
* Log aktivitas
* Multi cabang
* Mode offline

---

## 13. Penutup

Dokumen PRD ini menjadi acuan dalam pengembangan Sistem Informasi Manajemen Penjualan CaptGrill berbasis web agar sistem yang dibangun sesuai dengan kebutuhan pengguna dan mampu meningkatkan efektivitas operasional usaha.