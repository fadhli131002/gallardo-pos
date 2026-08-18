const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSalesMaster = async (req, res) => {
  try {
    const sales = await prisma.salesMaster.findMany({
      orderBy: { created_at: 'asc' }
    });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.addSalesMaster = async (req, res) => {
  try {
    const { sales_id, nama } = req.body;
    if (!nama) return res.status(400).json({ message: "Nama sales required" });
    
    let sid = sales_id;
    if (!sid) {
      // Auto-generate ID if not provided
      const allSales = await prisma.salesMaster.findMany({ select: { sales_id: true } });
      let maxNum = 0;
      allSales.forEach(s => {
        const match = s.sales_id ? s.sales_id.match(/#S(\d+)/i) : null;
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      sid = `#S${String(maxNum + 1).padStart(2, '0')}`;
    }

    const newSales = await prisma.salesMaster.create({
      data: { sales_id: sid, nama }
    });
    res.status(201).json(newSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateSalesMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama } = req.body;
    const updatedSales = await prisma.salesMaster.update({
      where: { sales_id: id },
      data: { nama }
    });
    res.json(updatedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteSalesMaster = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.salesMaster.delete({
      where: { sales_id: id }
    });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
