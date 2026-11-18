import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const InventoryContext = createContext();

export const useInventory = () => {
  return useContext(InventoryContext);
};

export const InventoryProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [inventory, setInventory] = useState([]);

  const [inventoryLogs, setInventoryLogs] = useState([]);

  const refreshInventoryFromApi = async () => {
    try {
      const activeToken = token || sessionStorage.getItem('token');
      if (!activeToken) {
        return;
      }

      // 1. Fetch inventory items
      const res = await fetch(window.API_URL + '/api/inventory', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(item => ({
            id: item.id,
            kategori: item.kategori,
            brand: item.brand,
            varian: item.varian,
            kegelapan: item.kegelapan || '',
            stokUtama: item.stok_utama,
            stokPecahan: item.stok_pecahan,
            harga_jual: Number(item.harga_jual) || 0,
            harga_modal: Number(item.harga_modal) || 0,
            satuan: item.satuan,
            branch: item.branch,
            konversi: item.konversi,
            minStok: item.min_stok
          }));
          setInventory(mapped);
        }
      }

      // 2. Fetch inventory logs (Diizinkan untuk admin, superadmin, owner, finance, dan inventory)
      let activeUser = user;
      if (!activeUser) {
        const stored = sessionStorage.getItem('user');
        if (stored) {
          try { activeUser = JSON.parse(stored); } catch (e) {}
        }
      }
      const userRole = (activeUser?.role || sessionStorage.getItem('userRole') || '').toLowerCase().trim();
      const allowedRoles = ['admin', 'superadmin', 'super_admin', 'super administrator', 'owner', 'finance', 'inventory'];

      if (allowedRoles.includes(userRole)) {
        const resLogs = await fetch(window.API_URL + '/api/inventory/logs', {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        if (resLogs.ok) {
          const jsonLogs = await resLogs.json();
          if (jsonLogs.success && Array.isArray(jsonLogs.data)) {
          const mappedLogs = jsonLogs.data.map(log => {
            const inv = log.inventory || {};
            const trx = log.transaction || {};
            const isRetail = trx.type === 'RETAIL' || (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum'));

            let konversi = inv.konversi || 1;
            const isLiter =
              String(inv.satuan || '').trim().toUpperCase().includes('LITER') ||
              String(inv.varian || '').trim().toUpperCase().includes('1 LITER');
            if (inv.kategori === 'Kaca Film') konversi = 30;
            else if (inv.kategori === 'PPF') konversi = 15;
            else if (inv.kategori === 'Coating') konversi = isLiter ? 1000 : 50;
            const deductedUtama = Math.floor((log.jumlah + 0.001) / konversi);
            const deductedPecahan = parseFloat((log.jumlah % konversi).toFixed(2));
            const totalDeducted = parseFloat(log.jumlah.toFixed(2));

            let deductedStr = '';
            if (inv.kategori === 'Tools & Equipment') {
              deductedStr = `${totalDeducted} ${inv.satuan || 'Pcs'}`;
            } else if (inv.kategori === 'Coating') {
              const dedUnits = Math.round((totalDeducted / (50 / 3)) * 10) / 10;
              deductedStr = `${totalDeducted} ml${dedUnits >= 1 ? ` (~${Math.round(totalDeducted / (50 / 3))} UNIT)` : ''}`;
            } else {
              const totalDedCM = Math.round(totalDeducted * 100).toLocaleString('id-ID');
              deductedStr = deductedUtama > 0
                ? `${deductedUtama} Roll ${deductedPecahan > 0 ? `+ ${Math.round(deductedPecahan * 100) / 100} m ` : ''}(${totalDedCM} CM)`
                : `${Math.round(totalDeducted * 100) / 100} m (${totalDedCM} CM)`;
            }

            const remUtama = Math.floor((log.stok_sesudah + 0.001) / konversi);
            const remPecahan = parseFloat((log.stok_sesudah % konversi).toFixed(2));
            const totalRem = parseFloat(log.stok_sesudah.toFixed(2));

            let remainingStr = '';
            if (inv.kategori === 'Tools & Equipment') {
              remainingStr = `${totalRem} ${inv.satuan || 'Pcs'}`;
            } else if (inv.kategori === 'Coating') {
              const unitPerUtama = isLiter ? 60 : 3;
              const remUnits = (remUtama * unitPerUtama) + Math.floor((remPecahan + 0.5) / (50 / 3));
              remainingStr = `${remUtama} ${inv.satuan || (isLiter ? 'LITER' : 'Botol')} + ${remPecahan} ml (${remUnits.toLocaleString('id-ID')} UNIT / ${Math.round(totalRem).toLocaleString('id-ID')} ML)`;
            } else {
              const totalRemCM = Math.round(totalRem * 100).toLocaleString('id-ID');
              remainingStr = `${remUtama} Roll + ${Math.round(remPecahan * 100) / 100} m (${totalRemCM} CM)`;
            }

            let serviceName = '';
            if (log.keterangan && log.keterangan.toLowerCase().includes('komplain')) {
              serviceName = 'Komplain / Klaim Garansi';
            } else {
              serviceName = trx.items && trx.items.length > 0
                ? trx.items.map(i => `${i.product_name}${i.quantity && i.quantity > 1 ? ` (x${i.quantity})` : ''}`).join(', ')
                : (log.jenis === 'RESTOCK' ? 'Restock Material' : log.jenis === 'ADJUST' ? 'Penyesuaian Stok' : 'Pemasangan Workshop');
            }

            const orderId = trx.id ? (typeof trx.id === 'string' ? trx.id : `WRK/300260700${trx.id}`) : (log.keterangan || 'Manual Admin');

            return {
              id: log.id,
              date: log.created_at,
              orderId: orderId,
              customerName: trx.customer_name || 'Pelanggan Umum',
              serviceName: serviceName,
              itemName: `${inv.brand || ''} ${inv.varian || ''}`.trim() || log.inventory_id,
              type: isRetail ? 'Retail (Grosir)' : 'Workshop (Pemasangan)',
              jenis: log.jenis,
              deducted: deductedStr,
              remaining: remainingStr,
              keterangan: log.keterangan
            };
          });
          setInventoryLogs(mappedLogs);
        }
      }
      }
    } catch (err) {
      console.error('Failed to sync inventory & logs from API:', err);
    }
  };

  useEffect(() => {
    refreshInventoryFromApi();
    const interval = setInterval(refreshInventoryFromApi, 3000);
    window.addEventListener('focus', refreshInventoryFromApi);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshInventoryFromApi);
    };
  }, [token]);

  const addStock = async (item) => {
    try {
      const activeToken = token || sessionStorage.getItem('token');
      if (activeToken) {
        const res = await fetch(window.API_URL + '/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            kategori: item.kategori,
            brand: item.brand,
            varian: item.varian,
            kegelapan: item.kegelapan,
            stok_utama: item.stokUtama,
            stok_pecahan: item.stokPecahan,
            harga_jual: item.harga_jual || 0,
            harga_modal: item.harga_modal || 0,
            satuan: item.satuan,
            branch: item.branch || 'Gallardo',
            konversi: item.konversi || 15
          })
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || 'Gagal menyimpan item ke server');
        }
        await refreshInventoryFromApi();
        return { success: true, data: json.data };
      } else {
        setInventory((prev) => [...prev, { ...item, id: `INV-${String(prev.length + 1).padStart(3, '0')}` }]);
        return { success: true };
      }
    } catch (err) {
      console.error('Error addStock API:', err);
      alert('Gagal menambahkan produk: ' + (err.message || 'Terjadi kesalahan'));
      return { success: false, error: err.message };
    }
  };

  const updateStock = async (id, updatedItem) => {
    try {
      const activeToken = token || sessionStorage.getItem('token');
      setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)));
      if (activeToken) {
        const res = await fetch(`${window.API_URL}/api/inventory/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            stok_utama: updatedItem.stokUtama,
            stok_pecahan: updatedItem.stokPecahan,
            harga_jual: updatedItem.harga_jual !== undefined ? updatedItem.harga_jual : (updatedItem.hargaJual || 0),
            harga_modal: updatedItem.harga_modal || 0,
            min_stok: updatedItem.minStok,
            kategori: updatedItem.kategori,
            brand: updatedItem.brand,
            varian: updatedItem.varian,
            kegelapan: updatedItem.kegelapan,
            satuan: updatedItem.satuan,
            konversi: updatedItem.konversi,
            keterangan: updatedItem.keterangan || 'Update stok oleh Admin'
          })
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || 'Gagal memperbarui stok di server');
        }
        await refreshInventoryFromApi();
        return { success: true, data: json.data };
      }
      return { success: true };
    } catch (err) {
      console.error('Error updateStock API:', err);
      alert('Gagal memperbarui produk: ' + (err.message || 'Terjadi kesalahan'));
      return { success: false, error: err.message };
    }
  };

  const updateHargaModal = async (id, harga_modal) => {
    try {
      const activeToken = token || sessionStorage.getItem('token');
      setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, harga_modal: Number(harga_modal) || 0 } : item)));
      if (activeToken) {
        const res = await fetch(`${window.API_URL}/api/inventory/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            harga_modal: Number(harga_modal) || 0,
            keterangan: 'Update Harga Modal (HPP) oleh Finance'
          })
        });
        await refreshInventoryFromApi();
        return res.ok;
      }
      return true;
    } catch (err) {
      console.error('Error updateHargaModal API:', err);
      return false;
    }
  };

  const deleteStock = async (id) => {
    try {
      const activeToken = token || sessionStorage.getItem('token');
      setInventory((prev) => prev.filter((item) => item.id !== id));
      if (activeToken) {
        const res = await fetch(`${window.API_URL}/api/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${activeToken}`
          }
        });
        const json = await res.json();
        if (!res.ok || json.success === false) {
          throw new Error(json.message || 'Gagal menghapus item dari server');
        }
        await refreshInventoryFromApi();
      }
    } catch (err) {
      console.error('Error deleteStock API:', err);
      alert('Gagal menghapus produk: ' + (err.message || 'Terjadi kesalahan'));
    }
  };

  const deductStock = (idBarang, jumlahDipotong) => {
    setInventory((prev) => {
      let nextInventory = [...prev];
      const index = nextInventory.findIndex((item) => item.id === idBarang);

      if (index !== -1) {
        let item = { ...nextInventory[index] };

        // Convert to base units for calculation
        let konversi = item.konversi || 1;
        if (item.kategori === 'Kaca Film') konversi = 30;
        else if (item.kategori === 'PPF') konversi = 15;
        const totalBaseStock = (item.stokUtama * konversi) + item.stokPecahan;
        const newTotalBaseStock = Math.max(0, totalBaseStock - jumlahDipotong);

        // Convert back to Utama and Pecahan
        item.stokUtama = Math.floor(newTotalBaseStock / konversi);
        item.stokPecahan = newTotalBaseStock % konversi;

        nextInventory[index] = item;
      }
      return nextInventory;
    });
  };

  const deductRetailStock = (idBarang, jumlahDipotong, isMeteran = false) => {
    setInventory((prev) => {
      let nextInventory = [...prev];
      const index = nextInventory.findIndex((item) => item.id === idBarang);

      if (index !== -1) {
        let item = { ...nextInventory[index] };

        if (isMeteran) {
          let konversi = item.konversi || 1;
          if (item.kategori === 'Kaca Film') konversi = 30;
          else if (item.kategori === 'PPF') konversi = 15;
          const totalBaseStock = (item.stokUtama * konversi) + item.stokPecahan;
          const newTotalBaseStock = Math.max(0, totalBaseStock - jumlahDipotong);
          item.stokUtama = Math.floor(newTotalBaseStock / konversi);
          item.stokPecahan = newTotalBaseStock % konversi;
        } else {
          item.stokUtama = Math.max(0, item.stokUtama - jumlahDipotong);
        }

        nextInventory[index] = item;
      }
      return nextInventory;
    });
  };

  const processInventoryDeduction = (order) => {
    let deductionItems = [];

    // --- RETAIL LOGIC ---
    if (order.type === 'RETAIL' && order.items && order.items.length > 0) {
      order.items.forEach(item => {
        if (item.trackInventory && item.id_barang) {
          const invObj = inventory.find(i => i.id === item.id_barang);
          if (invObj) {
            let amountInBaseUnits = 0;
            let unitStr = '';
            let logDisplayAmount = '';

            let konversi = invObj.konversi || 1;
            if (invObj.kategori === 'Kaca Film') konversi = 30;
            else if (invObj.kategori === 'PPF') konversi = 15;
            if (item.isMeteran) {
              amountInBaseUnits = item.qty;
              unitStr = 'm';
              logDisplayAmount = `${item.qty} ${unitStr}`;
            } else {
              amountInBaseUnits = item.qty * konversi;
              unitStr = (invObj.kategori === 'Kaca Film' || invObj.kategori === 'PPF') ? 'm' : invObj.satuan;
              logDisplayAmount = `${item.qty} Roll/Pcs`;
            }

            deductionItems.push({
              id: invObj.id,
              amount: amountInBaseUnits,
              name: `${invObj.brand} ${invObj.varian}`,
              unit: unitStr,
              displayAmount: logDisplayAmount,
              obj: invObj
            });
          }
        }
      });
    } else {
      // --- WORKSHOP LOGIC ---
      let requiredPPF = 0;
      let requiredCoating = 0;
      let requiredKacaFilm = 0;

      // 1. Identifikasi Standard Usage
      if (order.serviceType === 'PPF') {
        if (['Small', 'Medium'].includes(order.carSize)) requiredPPF = 15;
        else if (order.carSize === 'Large') requiredPPF = 17;
        else if (['Extra Large', 'Supercar'].includes(order.carSize)) requiredPPF = 18;

        // Conditional Trigger: PPF WAJIB memicu Coating
        requiredCoating = 16.7;
      } else if (order.serviceType === 'Kaca Film') {
        const isPerformante = (order.product || order.service || '').toLowerCase().includes('performante');
        if (!isPerformante) {
          requiredKacaFilm = 30; // 1 Roll
        }
      } else if (order.serviceType === 'Coating') {
        requiredCoating = 16.7;
      }

      // Cari ID inventory yang cocok untuk PPF
      if (requiredPPF > 0) {
        const ppfItem = inventory.find(i => i.kategori === 'PPF' && (order.product || order.service || '').toLowerCase().includes(i.varian.toLowerCase()));
        if (ppfItem) deductionItems.push({ id: ppfItem.id, amount: requiredPPF, displayAmount: `${requiredPPF} m`, name: `${ppfItem.brand} ${ppfItem.varian}`, unit: 'm', obj: ppfItem });
        else {
          // Fallback if not specifically found, grab any first PPF to ensure deduction logic runs
          const fallback = inventory.find(i => i.kategori === 'PPF');
          if (fallback) deductionItems.push({ id: fallback.id, amount: requiredPPF, displayAmount: `${requiredPPF} m`, name: `${fallback.brand} ${fallback.varian}`, unit: 'm', obj: fallback });
        }
      }

      // Cari ID untuk Kaca Film
      if (requiredKacaFilm > 0) {
        const kfItem = inventory.find(i => i.kategori === 'Kaca Film' && (order.product || order.service || '').toLowerCase().includes(i.varian.toLowerCase()));
        if (kfItem) deductionItems.push({ id: kfItem.id, amount: requiredKacaFilm, displayAmount: `${requiredKacaFilm} m`, name: `${kfItem.brand} ${kfItem.varian}`, unit: 'm', obj: kfItem });
        else {
          const fallback = inventory.find(i => i.kategori === 'Kaca Film' && !i.brand.toLowerCase().includes('performante'));
          if (fallback) deductionItems.push({ id: fallback.id, amount: requiredKacaFilm, displayAmount: `${requiredKacaFilm} m`, name: `${fallback.brand} ${fallback.varian}`, unit: 'm', obj: fallback });
        }
      }

      // Cari ID untuk Coating
      if (requiredCoating > 0) {
        const coatItem = inventory.find(i => i.kategori === 'Coating' && (order.product || order.service || '').toLowerCase().includes(i.varian.toLowerCase()));
        if (coatItem) deductionItems.push({ id: coatItem.id, amount: requiredCoating, displayAmount: `${requiredCoating} ml`, name: `${coatItem.brand} ${coatItem.varian}`, unit: 'ml', obj: coatItem });
        else {
          const fallback = inventory.find(i => i.kategori === 'Coating');
          if (fallback) deductionItems.push({ id: fallback.id, amount: requiredCoating, displayAmount: `${requiredCoating} ml`, name: `${fallback.brand} ${fallback.varian}`, unit: 'ml', obj: fallback });
        }
      }
    }

    // 2. Error Handling: Cek kecukupan stok sebelum potong
    for (const item of deductionItems) {
      let konversi = item.obj.konversi || 1;
      if (item.obj.kategori === 'Kaca Film') konversi = 30;
      else if (item.obj.kategori === 'PPF') konversi = 15;
      const totalBaseStock = (item.obj.stokUtama * konversi) + item.obj.stokPecahan;
      if (totalBaseStock < item.amount) {
        return { success: false, message: `Stok bahan tidak mencukupi untuk layanan ini (${item.name} butuh ${item.amount}${item.unit}, sisa ${totalBaseStock}${item.unit}).` };
      }
    }

    // 3. Eksekusi Pemotongan dan Pembuatan Log
    let alerts = [];
    const now = new Date().toISOString();
    let newLogs = [];

    // Calculate new state & logs outside functional updater to prevent React StrictMode double invocation
    let simulatedInventory = [...inventory];
    for (const item of deductionItems) {
      const index = simulatedInventory.findIndex(i => i.id === item.id);
      if (index !== -1) {
        let invItem = { ...simulatedInventory[index] };
        let konversi = invItem.konversi || 1;
        if (invItem.kategori === 'Kaca Film') konversi = 30;
        else if (invItem.kategori === 'PPF') konversi = 15;
        const totalBaseStock = (invItem.stokUtama * konversi) + invItem.stokPecahan;
        const newTotalBaseStock = Math.max(0, totalBaseStock - item.amount);

        invItem.stokUtama = Math.floor(newTotalBaseStock / konversi);
        invItem.stokPecahan = parseFloat((newTotalBaseStock % konversi).toFixed(2));

        simulatedInventory[index] = invItem;

        // Push Log
        newLogs.push({
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: now,
          orderId: order.id,
          serviceName: order.service || order.serviceType,
          itemName: item.name,
          deducted: item.displayAmount || `${item.amount} ${item.unit}`,
          remaining: `${invItem.stokUtama} ${invItem.satuan} ${invItem.stokPecahan > 0 ? `+ ${invItem.stokPecahan}${item.unit}` : ''}`
        });

        // Cek Low Stock Alert
        if (invItem.stokUtama < 1) {
          alerts.push(`Warning: Stok ${item.name} menipis, segera restock!`);
        }
      }
    }

    // Safely update inventory state
    setInventory(prev => {
      let nextInventory = [...prev];
      for (const item of deductionItems) {
        const index = nextInventory.findIndex(i => i.id === item.id);
        if (index !== -1) {
          let invItem = { ...nextInventory[index] };
          let konversi = invItem.konversi || 1;
          if (invItem.kategori === 'Kaca Film') konversi = 30;
          else if (invItem.kategori === 'PPF') konversi = 15;
          const totalBaseStock = (invItem.stokUtama * konversi) + invItem.stokPecahan;
          const newTotalBaseStock = Math.max(0, totalBaseStock - item.amount);

          invItem.stokUtama = Math.floor(newTotalBaseStock / konversi);
          invItem.stokPecahan = parseFloat((newTotalBaseStock % konversi).toFixed(2));
          nextInventory[index] = invItem;
        }
      }
      return nextInventory;
    });

    if (newLogs.length > 0) {
      setInventoryLogs(prevLogs => [...newLogs, ...prevLogs]);
    }

    return { success: true, alerts };
  };

  return (
    <InventoryContext.Provider value={{ inventory, inventoryLogs, addStock, updateStock, updateHargaModal, deleteStock, deductStock, deductRetailStock, processInventoryDeduction, refreshInventoryFromApi }}>
      {children}
    </InventoryContext.Provider>
  );
};
