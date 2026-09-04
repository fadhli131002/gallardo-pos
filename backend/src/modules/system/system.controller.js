const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'maintenance.json');

const getDefaultConfig = () => ({
  isActive: false,
  message: 'Pemberitahuan: Sistem POS Gallardo sedang dalam pemeliharaan (maintenance). Harap segera simpan transaksi atau pekerjaan Anda.',
  estimatedEnd: '',
  updatedAt: null,
  updatedBy: null
});

const readConfig = () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading maintenance.json:', err);
  }
  return getDefaultConfig();
};

const writeConfig = (config) => {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing maintenance.json:', err);
    return false;
  }
};

const getMaintenanceStatus = async (req, res) => {
  try {
    const config = readConfig();
    return res.json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil status maintenance: ' + error.message
    });
  }
};

const updateMaintenanceStatus = async (req, res) => {
  try {
    const { isActive, message, estimatedEnd } = req.body;

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Field "isActive" (boolean: true/false) wajib diisi.'
      });
    }

    const currentConfig = readConfig();
    const updatedBy = req.user?.name || req.user?.username || req.body.updatedBy || 'System Admin';

    const newConfig = {
      ...currentConfig,
      isActive: Boolean(isActive),
      message: message !== undefined ? String(message).trim() : currentConfig.message,
      estimatedEnd: estimatedEnd !== undefined ? String(estimatedEnd).trim() : currentConfig.estimatedEnd,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    const saved = writeConfig(newConfig);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan konfigurasi status maintenance.'
      });
    }

    return res.json({
      success: true,
      message: `Status maintenance berhasil diubah menjadi ${newConfig.isActive ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}`,
      data: newConfig
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status maintenance: ' + error.message
    });
  }
};

const toggleMaintenanceStatus = async (req, res) => {
  try {
    const currentConfig = readConfig();
    const newIsActive = !currentConfig.isActive;
    const updatedBy = req.user?.name || req.user?.username || req.body?.updatedBy || 'System Admin';

    const newConfig = {
      ...currentConfig,
      isActive: newIsActive,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    if (req.body?.message) {
      newConfig.message = String(req.body.message).trim();
    }

    const saved = writeConfig(newConfig);
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengubah konfigurasi status maintenance.'
      });
    }

    return res.json({
      success: true,
      message: `Status maintenance berhasil diubah menjadi ${newConfig.isActive ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}`,
      data: newConfig
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan toggle maintenance: ' + error.message
    });
  }
};

module.exports = {
  getMaintenanceStatus,
  updateMaintenanceStatus,
  toggleMaintenanceStatus,
  readConfig,
  writeConfig
};
