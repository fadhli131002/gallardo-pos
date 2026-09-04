const { readConfig, writeConfig } = require('./src/modules/system/system.controller');

const args = process.argv.slice(2);
const command = (args[0] || 'status').toLowerCase();
const customMessage = args.slice(1).join(' ').trim();

const currentConfig = readConfig();

if (command === 'on' || command === 'enable' || command === '1') {
  currentConfig.isActive = true;
  if (customMessage) {
    currentConfig.message = customMessage;
  }
  currentConfig.updatedAt = new Date().toISOString();
  currentConfig.updatedBy = 'CLI Tool';
  writeConfig(currentConfig);
  console.log('\n🔴 [MAINTENANCE MODE: AKTIF (ON)]');
  console.log('Pesan:', currentConfig.message);
  console.log('Waktu update:', currentConfig.updatedAt);
  console.log('Banner merah di frontend sekarang akan otomatis tampil.\n');
} else if (command === 'off' || command === 'disable' || command === '0') {
  currentConfig.isActive = false;
  currentConfig.updatedAt = new Date().toISOString();
  currentConfig.updatedBy = 'CLI Tool';
  writeConfig(currentConfig);
  console.log('\n🟢 [MAINTENANCE MODE: NONAKTIF (OFF)]');
  console.log('Sistem kembali beroperasi normal. Banner merah di frontend telah disembunyikan.\n');
} else if (command === 'toggle') {
  currentConfig.isActive = !currentConfig.isActive;
  if (customMessage && currentConfig.isActive) {
    currentConfig.message = customMessage;
  }
  currentConfig.updatedAt = new Date().toISOString();
  currentConfig.updatedBy = 'CLI Tool';
  writeConfig(currentConfig);
  console.log(`\n${currentConfig.isActive ? '🔴 [MAINTENANCE MODE: AKTIF (ON)]' : '🟢 [MAINTENANCE MODE: NONAKTIF (OFF)]'}`);
  console.log('Pesan:', currentConfig.message);
  console.log('Waktu update:', currentConfig.updatedAt);
  console.log('');
} else {
  console.log('\n📋 [STATUS MAINTENANCE SAAT INI]');
  console.log('Status  :', currentConfig.isActive ? '🔴 AKTIF (ON)' : '🟢 NONAKTIF (OFF)');
  console.log('Pesan   :', currentConfig.message);
  console.log('Update  :', currentConfig.updatedAt || '-');
  console.log('Pengubah:', currentConfig.updatedBy || '-');
  console.log('\nCara Penggunaan:');
  console.log('  node toggle_maintenance.js on [pesan opsional]');
  console.log('  node toggle_maintenance.js off');
  console.log('  node toggle_maintenance.js toggle');
  console.log('  node toggle_maintenance.js status\n');
}
