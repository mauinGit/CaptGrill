const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Cleaning up orphan data...\n');

  // 1. Delete recipes: "Patty" and "Saus Kebab" (+ their production logs & compositions)
  const recipeNames = ['Patty', 'Saus Kebab'];
  for (const name of recipeNames) {
    const recipe = await prisma.recipe.findFirst({ where: { name } });
    if (recipe) {
      // Delete production logs first
      const logsDeleted = await prisma.productionLog.deleteMany({ where: { recipeId: recipe.id } });
      if (logsDeleted.count > 0) console.log(`  🗑️  ${logsDeleted.count} production logs dihapus`);

      // Delete compositions (cascade should handle, but just in case)
      const compsDeleted = await prisma.recipeComposition.deleteMany({ where: { recipeId: recipe.id } });
      if (compsDeleted.count > 0) console.log(`  🗑️  ${compsDeleted.count} komposisi dihapus`);

      // Now delete the recipe
      await prisma.recipe.delete({ where: { id: recipe.id } });
      console.log(`✅ Resep "${name}" dihapus (id: ${recipe.id})`);
    } else {
      console.log(`⚠️  Resep "${name}" tidak ditemukan`);
    }
  }

  // 2. Delete ingredients: "Patty Burger" and "Saus Kebab"
  const ingredientNames = ['Patty Burger', 'Saus Kebab'];
  for (const name of ingredientNames) {
    const ing = await prisma.ingredient.findFirst({ where: { name } });
    if (ing) {
      // Check if still referenced
      const menuRefs = await prisma.menuIngredient.count({ where: { ingredientId: ing.id } });
      const recipeCompRefs = await prisma.recipeComposition.count({ where: { ingredientId: ing.id } });
      const recipeOutputRefs = await prisma.recipe.count({ where: { ingredientId: ing.id } });

      if (menuRefs > 0 || recipeCompRefs > 0 || recipeOutputRefs > 0) {
        console.log(`⚠️  Bahan "${name}" masih direferensi (menu: ${menuRefs}, komposisi: ${recipeCompRefs}, resep output: ${recipeOutputRefs}), skip`);
        continue;
      }
      await prisma.ingredient.delete({ where: { id: ing.id } });
      console.log(`✅ Bahan "${name}" dihapus (id: ${ing.id})`);
    } else {
      console.log(`⚠️  Bahan "${name}" tidak ditemukan`);
    }
  }

  console.log('\n🎉 Cleanup selesai!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
