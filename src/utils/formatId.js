export const formatTransactionId = (trx) => {
  if (!trx) return '-';
  
  // Jika ID sudah diformat sebelumnya (string yang mengandung slash), kembalikan as is.
  if (typeof trx.id === 'string' && trx.id.includes('/')) return trx.id;

  const isRetail = trx.type === 'RETAIL' ||
    (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum')) ||
    (trx.items && trx.items.some(i => (i.product_name || '').toLowerCase().includes('roll')));

  const prefix = isRetail ? 'RTL' : 'WRK';
  const dateObj = new Date(trx.created_at || Date.now());
  const yy = String(dateObj.getFullYear()).slice(-2);
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');

  let prodIdStr = '001';
  const primaryItem = (trx.items || [])[0];
  if (primaryItem) {
    const pName = primaryItem.product_name || '';
    if (pName.includes('Matte')) prodIdStr = '002';
    else if (pName.includes('Armor')) prodIdStr = '003';
    else if (pName.includes('Super Safe')) prodIdStr = '004';
    else if (pName.includes('Color')) prodIdStr = '005';
    else if (pName.includes('Iron Black 35')) prodIdStr = '010';
    else if (pName.includes('Iron Black 20')) prodIdStr = '011';
    else if (pName.includes('Iron Black 05')) prodIdStr = '012';
    else if (pName.includes('Aplikator')) prodIdStr = '023';
  }

  // Gunakan ID database asli untuk memastikan konsistensi di semua halaman
  const seqNum = String(trx.id || 0).padStart(4, '0');
  
  return `${prefix}/${yy}-${mm}-${prodIdStr}-${seqNum}`;
};
