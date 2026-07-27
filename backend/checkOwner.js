const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('owner123', 10);
  await p.user.updateMany({
    where: { role: 'owner' },
    data: { password: hash }
  });
  console.log('Password updated to owner123');
  await p.$disconnect();
}

main();
