const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res) => {
  try {
    const data = await prisma.masterPotonganPPF.findMany({
      orderBy: { id: 'asc' }
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.masterPotonganPPF.findUnique({
      where: { id: parseInt(id) }
    });
    if (!data) return res.status(404).json({ message: 'Data tidak ditemukan' });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { ukuranKendaraan, peruntukan, potonganCm } = req.body;
    const data = await prisma.masterPotonganPPF.create({
      data: {
        ukuranKendaraan,
        peruntukan,
        potonganCm: parseFloat(potonganCm)
      }
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ukuranKendaraan, peruntukan, potonganCm } = req.body;
    const data = await prisma.masterPotonganPPF.update({
      where: { id: parseInt(id) },
      data: {
        ukuranKendaraan,
        peruntukan,
        potonganCm: parseFloat(potonganCm)
      }
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.masterPotonganPPF.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ message: 'Berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
