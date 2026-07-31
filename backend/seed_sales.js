const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const count = await p.salesMaster.count();
  if (count === 0) {
    const defaultSales = [
      { sales_id: '#S01', nama: 'Rosyid' },
      { sales_id: '#S02', nama: 'Femmy' },
      { sales_id: '#S03', nama: 'Syauqi' },
      { sales_id: '#S04', nama: 'Cantika' },
      { sales_id: '#S05', nama: 'Caca' },
      { sales_id: '#S06', nama: 'Daniel' }
    ];
    await p.salesMaster.createMany({ data: defaultSales });
    console.log('Seeded SalesMaster successfully');
  } else {
    console.log('SalesMaster already seeded');
  }
}

main().then(() => p.$disconnect()).catch(console.error);
