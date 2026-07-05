const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("Categories in DB:", categories.map(c => ({ name: c.name, isActive: c.isActive })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
