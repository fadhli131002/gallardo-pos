const fs = require('fs');
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  try {
    fs.appendFileSync('backend_error.log', new Date().toISOString() + '\n' + (err.stack || err.message) + '\n\n');
  } catch (e) {}

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
module.exports = errorHandler;
