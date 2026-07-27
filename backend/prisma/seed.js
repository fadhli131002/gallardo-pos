const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const vehiclesData = [
  // Small
  { brand: 'Honda', model: 'Brio', size: 'Small' },
  { brand: 'Honda', model: 'City Hatchback', size: 'Small' },
  { brand: 'Toyota', model: 'Agya', size: 'Small' },
  { brand: 'Toyota', model: 'Yaris', size: 'Small' },
  { brand: 'Daihatsu', model: 'Ayla', size: 'Small' },
  { brand: 'Daihatsu', model: 'Sirion', size: 'Small' },
  { brand: 'Suzuki', model: 'Ignis', size: 'Small' },
  { brand: 'Suzuki', model: 'Baleno', size: 'Small' },

  // Medium
  { brand: 'Toyota', model: 'Avanza', size: 'Medium' },
  { brand: 'Toyota', model: 'Veloz', size: 'Medium' },
  { brand: 'Toyota', model: 'Raize', size: 'Medium' },
  { brand: 'Toyota', model: 'Corolla Altis', size: 'Medium' },
  { brand: 'Daihatsu', model: 'Xenia', size: 'Medium' },
  { brand: 'Daihatsu', model: 'Rocky', size: 'Medium' },
  { brand: 'Honda', model: 'HR-V', size: 'Medium' },
  { brand: 'Honda', model: 'BR-V', size: 'Medium' },
  { brand: 'Honda', model: 'Civic', size: 'Medium' },
  { brand: 'Hyundai', model: 'Creta', size: 'Medium' },
  { brand: 'Hyundai', model: 'Stargazer', size: 'Medium' },
  { brand: 'Mitsubishi', model: 'Xpander', size: 'Medium' },
  { brand: 'Mitsubishi', model: 'Xpander Cross', size: 'Medium' },
  { brand: 'Wuling', model: 'Alvez', size: 'Medium' },
  { brand: 'Wuling', model: 'Confero', size: 'Medium' },

  // Large
  { brand: 'Toyota', model: 'Innova Zenix', size: 'Large' },
  { brand: 'Toyota', model: 'Fortuner', size: 'Large' },
  { brand: 'Toyota', model: 'Alphard', size: 'Large' },
  { brand: 'Toyota', model: 'Land Cruiser', size: 'Large' },
  { brand: 'Mitsubishi', model: 'Pajero Sport', size: 'Large' },
  { brand: 'Mitsubishi', model: 'Triton', size: 'Large' },
  { brand: 'Hyundai', model: 'Santa Fe', size: 'Large' },
  { brand: 'Hyundai', model: 'Palisade', size: 'Large' },
  { brand: 'Hyundai', model: 'Ioniq 5', size: 'Large' },
  { brand: 'Honda', model: 'CR-V', size: 'Large' },
  { brand: 'Wuling', model: 'Almaz', size: 'Large' },
  { brand: 'Ford', model: 'Ranger', size: 'Large' },

  // XL / Luxury Car
  { brand: 'Porsche', model: '911', size: 'XL/Luxury Car' },
  { brand: 'Porsche', model: 'Cayenne', size: 'XL/Luxury Car' },
  { brand: 'Porsche', model: 'Macan', size: 'XL/Luxury Car' },
  { brand: 'BMW', model: 'Seri 3', size: 'XL/Luxury Car' },
  { brand: 'BMW', model: 'Seri 5', size: 'XL/Luxury Car' },
  { brand: 'BMW', model: 'X5', size: 'XL/Luxury Car' },
  { brand: 'Mercedes-Benz', model: 'C-Class', size: 'XL/Luxury Car' },
  { brand: 'Mercedes-Benz', model: 'E-Class', size: 'XL/Luxury Car' },
  { brand: 'Mercedes-Benz', model: 'GLC', size: 'XL/Luxury Car' },
  { brand: 'Lexus', model: 'RX 350', size: 'XL/Luxury Car' },
  { brand: 'Lexus', model: 'LX 600', size: 'XL/Luxury Car' },
  { brand: 'Tesla', model: 'Model 3', size: 'XL/Luxury Car' },
  { brand: 'Tesla', model: 'Model Y', size: 'XL/Luxury Car' }
];

async function main() {
  console.log('Start seeding vehicles...');

  // Get existing vehicles
  const existingVehicles = await prisma.vehicle.findMany();
  
  let addedCount = 0;
  
  for (const vData of vehiclesData) {
    const exists = existingVehicles.some(ev => 
      ev.brand.toLowerCase() === vData.brand.toLowerCase() && 
      ev.model.toLowerCase() === vData.model.toLowerCase()
    );
    
    if (!exists) {
      await prisma.vehicle.create({
        data: vData
      });
      addedCount++;
      console.log(`Added: ${vData.brand} ${vData.model}`);
    } else {
      console.log(`Skipped (Already exists): ${vData.brand} ${vData.model}`);
    }
  }

  console.log(`Seeding finished. Added ${addedCount} new vehicles.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });