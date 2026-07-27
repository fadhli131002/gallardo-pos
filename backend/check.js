const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

prisma.payment.findMany({ orderBy: { id: 'desc' }, take: 5 }).then(rows => { 
  console.log(JSON.stringify(rows.map(r => ({
    ...r, 
    payment_proof: r.payment_proof ? r.payment_proof.substring(0, 50) + '...' : null
  })), null, 2)); 
  prisma.$disconnect(); 
});
