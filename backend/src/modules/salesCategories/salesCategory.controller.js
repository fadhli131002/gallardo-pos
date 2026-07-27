const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllSalesCategories = async (req, res) => {
  try {
    const categories = await prisma.salesCategory.findMany({
      orderBy: { created_at: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching sales categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createSalesCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newCategory = await prisma.salesCategory.create({
      data: { name }
    });
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    console.error('Error creating sales category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteSalesCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.salesCategory.delete({
      where: { id }
    });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('Error deleting sales category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
