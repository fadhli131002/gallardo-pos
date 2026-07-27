const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: [
        { brand: 'asc' },
        { model: 'asc' }
      ]
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

exports.createVehicle = async (req, res) => {
  const { brand, model, size } = req.body;
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        size
      }
    });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

exports.updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { brand, model, size } = req.body;
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(id, 10) },
      data: { brand, model, size }
    });
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

exports.deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.vehicle.delete({
      where: { id: parseInt(id, 10) }
    });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};
