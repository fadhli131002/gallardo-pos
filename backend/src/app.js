const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./modules/auth/auth.routes');
const transactionRoutes = require('./modules/transactions/transaction.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const complaintRoutes = require('./modules/complaints/complaint.routes');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const salesCategoryRoutes = require('./modules/salesCategories/salesCategory.routes');
const salesMasterRoutes = require('./modules/salesMaster/salesMaster.routes');
const variantRoutes = require('./modules/variants/variant.routes');
const ownerRoutes = require('./modules/owner/owner.routes');
const financeRoutes = require('./modules/finance/finance.routes');
const ppfMasterRoutes = require('./modules/ppfMaster/ppfMaster.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const systemRoutes = require('./modules/system/system.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/sales-categories', salesCategoryRoutes);
app.use('/api/sales-master', salesMasterRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/master-ppf', ppfMasterRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system', systemRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
