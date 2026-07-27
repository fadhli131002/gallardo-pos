const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, name: u.username, role: u.role })));
}
run().finally(() => prisma.$disconnect());
