const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('gudang123', 10);
  
  const existing = await prisma.user.findUnique({
    where: { username: 'gudang' }
  });

  if (existing) {
    await prisma.user.update({
      where: { username: 'gudang' },
      data: {
        name: 'Mba Umi',
        password: hashedPassword,
        role: 'inventory'
      }
    });
    console.log('User "gudang" updated.');
  } else {
    await prisma.user.create({
      data: {
        name: 'Mba Umi',
        username: 'gudang',
        password: hashedPassword,
        role: 'inventory'
      }
    });
    console.log('User "gudang" created successfully.');
  }

  // Also create "inventory"
  const existing2 = await prisma.user.findUnique({
    where: { username: 'inventory' }
  });

  if (existing2) {
    await prisma.user.update({
      where: { username: 'inventory' },
      data: {
        name: 'Staff Inventory',
        password: hashedPassword,
        role: 'inventory'
      }
    });
    console.log('User "inventory" updated.');
  } else {
    await prisma.user.create({
      data: {
        name: 'Staff Inventory',
        username: 'inventory',
        password: hashedPassword,
        role: 'inventory'
      }
    });
    console.log('User "inventory" created successfully.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
