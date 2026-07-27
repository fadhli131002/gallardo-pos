const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.salesCategory.findMany().then(data => {
  console.log(data);
  prisma.$disconnect();
});
