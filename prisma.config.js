require('dotenv').config();

const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
  datasource: {
    url: process.env.DIRECT_URL,  // Pakai DIRECT_URL untuk migrasi
  },
});