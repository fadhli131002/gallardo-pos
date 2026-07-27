const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Product Peruntukan
exports.getPeruntukan = async (req, res) => {
  try {
    const data = await prisma.productPeruntukan.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.createPeruntukan = async (req, res) => {
  try {
    const { name, category } = req.body;
    const data = await prisma.productPeruntukan.create({ data: { name, category } });
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.deletePeruntukan = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.productPeruntukan.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.updatePeruntukan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    const data = await prisma.productPeruntukan.update({
      where: { id: Number(id) },
      data: { name, category }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Posisi Pemasangan
exports.getPosisi = async (req, res) => {
  try {
    const data = await prisma.posisiPemasangan.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.createPosisi = async (req, res) => {
  try {
    const { name } = req.body;
    const data = await prisma.posisiPemasangan.create({ data: { name } });
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.deletePosisi = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.posisiPemasangan.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Posisi Partial
exports.getPartial = async (req, res) => {
  try {
    const data = await prisma.posisiPartial.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.createPartial = async (req, res) => {
  try {
    const { name } = req.body;
    const data = await prisma.posisiPartial.create({ data: { name } });
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
exports.deletePartial = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.posisiPartial.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
