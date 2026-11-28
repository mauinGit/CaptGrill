-- Hasil per 1x produksi untuk resep Pembuatan Bahan.
-- Default 1 supaya resep lama tetap berperilaku sama seperti sebelumnya.
ALTER TABLE "recipes" ADD COLUMN "outputQuantity" DECIMAL(65,30) NOT NULL DEFAULT 1;
