const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin CaptGrill',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.username);

  // Create kasir user
  const kasirPassword = await bcrypt.hash('kasir123', 10);
  const kasir = await prisma.user.upsert({
    where: { username: 'kasir1' },
    update: {},
    create: {
      username: 'kasir1',
      password: kasirPassword,
      name: 'Kasir Satu',
      role: 'KASIR',
    },
  });
  console.log('✅ Kasir created:', kasir.username);

  // Create ingredients
  // const ingredients = await Promise.all([
  //   prisma.ingredient.upsert({
  //     where: { id: 1 },
  //     update: {},
  //     create: { name: 'Roti Burger', unit: 'pcs', stock: 100, minStock: 20 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 2 },
  //     update: {},
  //     create: { name: 'Daging Patty', unit: 'pcs', stock: 80, minStock: 15 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 3 },
  //     update: {},
  //     create: { name: 'Tortilla', unit: 'pcs', stock: 120, minStock: 25 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 4 },
  //     update: {},
  //     create: { name: 'Daging Kebab', unit: 'gram', stock: 5000, minStock: 500 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 5 },
  //     update: {},
  //     create: { name: 'Selada', unit: 'gram', stock: 3000, minStock: 300 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 6 },
  //     update: {},
  //     create: { name: 'Keju Slice', unit: 'pcs', stock: 100, minStock: 20 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 7 },
  //     update: {},
  //     create: { name: 'Saus Sambal', unit: 'ml', stock: 5000, minStock: 500 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 8 },
  //     update: {},
  //     create: { name: 'Mayonaise', unit: 'ml', stock: 4000, minStock: 400 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 9 },
  //     update: {},
  //     create: { name: 'Es Batu', unit: 'pcs', stock: 500, minStock: 50 },
  //   }),
  //   prisma.ingredient.upsert({
  //     where: { id: 10 },
  //     update: {},
  //     create: { name: 'Sirup Coklat', unit: 'ml', stock: 2000, minStock: 200 },
  //   }),
  // ]);
  // console.log('✅ Ingredients created:', ingredients.length);

  // Create menus
  const menus = await Promise.all([
    prisma.menu.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Burger Classic',
        price: 25000,
        category: 'Makanan',
        menuIngredients: {
          create: [
            { ingredientId: 1, quantity: 1 },
            { ingredientId: 2, quantity: 1 },
            { ingredientId: 5, quantity: 30 },
            { ingredientId: 8, quantity: 15 },
          ],
        },
      },
    }),
    prisma.menu.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Burger Cheese',
        price: 30000,
        category: 'Makanan',
        menuIngredients: {
          create: [
            { ingredientId: 1, quantity: 1 },
            { ingredientId: 2, quantity: 1 },
            { ingredientId: 5, quantity: 30 },
            { ingredientId: 6, quantity: 2 },
            { ingredientId: 8, quantity: 15 },
          ],
        },
      },
    }),
    prisma.menu.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Kebab Original',
        price: 20000,
        category: 'Makanan',
        menuIngredients: {
          create: [
            { ingredientId: 3, quantity: 1 },
            { ingredientId: 4, quantity: 100 },
            { ingredientId: 5, quantity: 20 },
            { ingredientId: 7, quantity: 10 },
            { ingredientId: 8, quantity: 10 },
          ],
        },
      },
    }),
    prisma.menu.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'Kebab Jumbo',
        price: 28000,
        category: 'Makanan',
        menuIngredients: {
          create: [
            { ingredientId: 3, quantity: 1 },
            { ingredientId: 4, quantity: 150 },
            { ingredientId: 5, quantity: 30 },
            { ingredientId: 6, quantity: 1 },
            { ingredientId: 7, quantity: 15 },
            { ingredientId: 8, quantity: 15 },
          ],
        },
      },
    }),
    prisma.menu.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: 'Es Coklat',
        price: 10000,
        category: 'Minuman',
        menuIngredients: {
          create: [
            { ingredientId: 9, quantity: 5 },
            { ingredientId: 10, quantity: 30 },
          ],
        },
      },
    }),
    prisma.menu.upsert({
      where: { id: 6 },
      update: {},
      create: {
        name: 'Es Teh',
        price: 5000,
        category: 'Minuman',
        menuIngredients: {
          create: [
            { ingredientId: 9, quantity: 5 },
          ],
        },
      },
    }),
  ]);
  console.log('✅ Menus created:', menus.length);

  console.log('\n🎉 Seeding complete!');
  console.log('📋 Default credentials:');
  console.log('   Admin  → username: admin, password: admin123');
  console.log('   Kasir  → username: kasir1, password: kasir123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
