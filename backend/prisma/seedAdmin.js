const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Admin account...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      role: 'admin',
      name: 'Administrator'
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'Administrator'
    }
  });

  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      password: hashedPassword,
      role: 'superadmin',
      name: 'Super Administrator'
    },
    create: {
      username: 'superadmin',
      password: hashedPassword,
      role: 'superadmin',
      name: 'Super Administrator'
    }
  });

  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {
      password: hashedPassword,
      role: 'owner',
      name: 'Owner Gallardo'
    },
    create: {
      username: 'owner',
      password: hashedPassword,
      role: 'owner',
      name: 'Owner Gallardo'
    }
  });

  console.log('✅ Admin, Superadmin, and Owner accounts seeded successfully.');
  console.log('Username: admin | Password: admin123');
  console.log('Username: superadmin | Password: admin123');
  console.log('Username: owner | Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
