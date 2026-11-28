-- Urutan bahan yang bisa diatur sendiri oleh admin (tekan-tahan & geser).
ALTER TABLE "ingredients" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Isi awal mengikuti urutan abjad sekarang supaya tampilan tidak berubah.
UPDATE "ingredients" AS i
SET "sortOrder" = o.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY LOWER("name"), "id") AS rn FROM "ingredients") AS o
WHERE i."id" = o."id";
