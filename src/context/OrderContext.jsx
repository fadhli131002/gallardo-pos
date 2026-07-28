import { createContext, useState, useContext, useEffect } from 'react';
import { addDays } from 'date-fns';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const { token } = useAuth();

  const refreshOrdersFromApi = async () => {
    try {
      if (!token) {
        setOrders([]);
        return;
      }

      const response = await fetch('http://31.97.51.101/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const resData = await response.json();
        const rawList = resData.data || resData.transactions || [];
        const list = Array.isArray(rawList) ? rawList : [];

        // Sort chronologically ascending (oldest first) so order sequence starts at 0001
        const sortedAsc = [...list].sort((a, b) => {
          const dA = new Date(a.created_at || a.id).getTime();
          const dB = new Date(b.created_at || b.id).getTime();
          return dA - dB || (a.id - b.id);
        });

        const groupedOrders = [];

        sortedAsc.forEach((trx, index) => {
          const isLunas = (trx.status_pembayaran || '').toUpperCase() === 'LUNAS' || (trx.sisa_tagihan <= 0);
          const remainingAmount = isLunas ? 0 : (trx.sisa_tagihan || 0);
          const paidAmount = isLunas ? (trx.total_amount || 0) : Math.max(0, (trx.total_amount || 0) - remainingAmount);

          const isRetail = trx.type === 'RETAIL' ||
            (trx.customer_name && trx.customer_name.toLowerCase().includes('pelanggan umum')) ||
            (trx.items && trx.items.some(i => (i.product_name || '').toLowerCase().includes('roll')));

          const serviceName = (trx.items || []).map(item => `${item.product_name} (x${item.quantity || 1})`).join(', ') || 'Layanan POS';
          const primaryItem = (trx.items || [])[0];
          let serviceType = 'Lainnya';
          if (primaryItem) {
            const pName = (primaryItem.product_name || '');
            const pNameUpper = pName.toUpperCase();
            if (pNameUpper.includes('KACA FILM') || pNameUpper.includes('PERFORMANTE') || pNameUpper.includes('DELUXE') || pNameUpper.includes('CLASSIC') || pNameUpper.includes('JET BLACK') || pNameUpper.includes('IRON BLACK')) serviceType = 'Kaca Film';
            else if (pNameUpper.includes('PPF') || pNameUpper.includes('VANSGARD')) serviceType = 'PPF';
            else if (pNameUpper.includes('COATING') || pNameUpper.includes('RANTIZ')) serviceType = 'Coating';
          }

          const prefix = isRetail ? 'RTL' : 'WRK';
          const dateObj = new Date(trx.created_at || Date.now());
          const yy = String(dateObj.getFullYear()).slice(-2);
          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');

          let prodIdStr = '001';
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

          const seqNum = String(index + 1).padStart(4, '0');
          const formattedId = `${prefix}/${yy}${mm}${prodIdStr}${seqNum}`;
          const trxId = typeof trx.id === 'string' && trx.id.includes('/') ? trx.id : formattedId;

          const orderObj = {
            id: trxId,
            customerName: trx.customer_name || 'Pelanggan Umum (Tanpa Nama)',
            customerHp: trx.customer_phone || '-',
            customerAddress: trx.customer_address || '-',
            carBrand: trx.car_brand || trx.carBrand || 'Toyota',
            carModel: trx.car_model || trx.carModel || 'Camry',
            plateNumber: trx.plate_number || trx.plateNumber || 'B 1234 XYZ',
            chassisNumber: trx.chassis_number || trx.chassisNumber || '-',
            engineNumber: trx.engine_number || trx.engineNumber || '-',
            carYear: trx.car_year || trx.carYear || '-',
            installationDate: trx.installation_date || trx.installationDate || '',
            installationTime: trx.installation_time || trx.installationTime || '',
            service: serviceName,
            serviceType: serviceType,
            totalPrice: trx.total_amount || 0,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            paymentType: trx.payment_type || (isLunas ? 'Lunas' : (trx.status_pembayaran || 'Belum Bayar')),
            paymentMethod: trx.payment_method || 'Penagihan',
            terminSchedule: (() => {
              try {
                return trx.termin_schedule ? JSON.parse(trx.termin_schedule) : [];
              } catch (e) {
                return [];
              }
            })(),
            spgName: trx.event || null,
            date: trx.created_at || new Date().toISOString(),
            type: isRetail ? 'RETAIL' : 'WORKSHOP',
            // Default new maintenance transactions to 'OPEN' unless it's explicitly completed
            status: (isLunas && !serviceName.toLowerCase().includes('maintenance')) ? 'Selesai' : 'OPEN',
            location: 'Gallardo',
            notes: trx.notes || '',
            items: (trx.items || []).map(item => ({
              name: item.product_name,
              finalPrice: item.price,
              qty: item.quantity,
              notes: item.product_note
            })),
            paymentHistory: (trx.payments || []).map(p => ({
              date: p.created_at || new Date().toISOString(),
              amount: p.amount,
              method: p.method,
              notes: p.notes,
              paymentProof: p.payment_proof || null
            })),
            complaints: (trx.complaints || []).map(c => ({
              id: c.id,
              date: c.created_at || new Date().toISOString(),
              problem_type: c.problem_type,
              description: c.description,
              proof_photo: c.proof_photo,
              status: c.status
            })),
            dbId: trx.id,
            historyMaintenance: []
          };

          // Grouping logic based on chassis_number or plate_number
          if (!isRetail) {
            const hasIdentifier = (orderObj.chassisNumber && orderObj.chassisNumber !== '-') ||
              (orderObj.plateNumber && orderObj.plateNumber !== 'B 1234 XYZ');
            if (hasIdentifier) {
              const existingIndex = groupedOrders.findIndex(o =>
                o.customerName.toLowerCase() === orderObj.customerName.toLowerCase() &&
                ((o.chassisNumber !== '-' && o.chassisNumber.toLowerCase() === orderObj.chassisNumber.toLowerCase()) ||
                  (o.plateNumber !== 'B 1234 XYZ' && o.plateNumber.toLowerCase() === orderObj.plateNumber.toLowerCase()))
              );

              if (existingIndex !== -1) {
                groupedOrders[existingIndex].historyMaintenance.push({
                  ...orderObj,
                  isMaintenance: true
                });
                return; // Skip pushing to groupedOrders array
              }
            }
          }

          groupedOrders.push(orderObj);
        });

        setOrders(groupedOrders);
      }
    } catch (err) {
      console.error('Error fetching transactions in context:', err);
    }
  };

  const refreshVehiclesFromApi = async () => {
    try {
      if (!token) {
        setVehicles([]);
        return;
      }
      const response = await fetch('http://31.97.51.101/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const refreshCategoriesFromApi = async () => {
    try {
      if (!token) {
        setCategories([]);
        return;
      }
      const response = await fetch('http://31.97.51.101/api/sales-categories', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const refreshVariantsFromApi = async () => {
    try {
      if (!token) return;

      const resPeruntukan = await fetch('http://31.97.51.101/api/variants/peruntukan', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
      if (resPeruntukan.ok) {
        const data = await resPeruntukan.json();
        // Map database fields (name, category) to UI expected fields (nama, kategori)
        setPeruntukanItems(data.map(p => ({ id: p.id, nama: p.name, kategori: p.category })));
      }

      const resPosisi = await fetch('http://31.97.51.101/api/variants/posisi', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
      if (resPosisi.ok) {
        const data = await resPosisi.json();
        setPosisiPemasangan(data);
      }

      const resPartial = await fetch('http://31.97.51.101/api/variants/partial', { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' });
      if (resPartial.ok) {
        const data = await resPartial.json();
        setPosisiPartial(data);
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
    }
  };


  useEffect(() => {
    refreshOrdersFromApi();
    refreshVehiclesFromApi();
    refreshCategoriesFromApi();
    const interval = setInterval(() => {
      refreshOrdersFromApi();
      refreshVehiclesFromApi();
      refreshCategoriesFromApi();
      refreshVariantsFromApi();
    }, 3000);
    const handleFocus = () => {
      refreshOrdersFromApi();
      refreshVehiclesFromApi();
      refreshCategoriesFromApi();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token]);

  const [categories, setCategories] = useState([]);
  const [peruntukanItems, setPeruntukanItems] = useState([]);
  const [posisiPemasangan, setPosisiPemasangan] = useState([]);
  const [posisiPartial, setPosisiPartial] = useState([]);

  const [salesItems, setSalesItems] = useState([
    { id: '#S01', nama: 'Rosyid' },
    { id: '#S02', nama: 'Femmy' },
    { id: '#S03', nama: 'Syauqi' },
    { id: '#S04', nama: 'Cantika' },
    { id: '#S05', nama: 'Caca' },
    { id: '#S06', nama: 'Daniel' }
  ]);

  const addSales = (sales) => setSalesItems(prev => [...prev, sales]);
  const removeSales = (id) => setSalesItems(prev => prev.filter(s => s.id !== id));
  const updateSales = (id, updatedItem) => setSalesItems(prev => prev.map(s => s.id === id ? { ...s, ...updatedItem } : s));


  // CRUD for Kaca Film variants
  const addPosisiPemasangan = async (item) => {
    try {
      const response = await fetch('http://31.97.51.101/api/variants/posisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: item })
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };
  const removePosisiPemasangan = async (id) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/variants/posisi/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };

  const addPosisiPartial = async (item) => {
    try {
      const response = await fetch('http://31.97.51.101/api/variants/partial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: item })
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };
  const removePosisiPartial = async (id) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/variants/partial/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };

  const addPeruntukan = async (peruntukan) => {
    try {
      const response = await fetch('http://31.97.51.101/api/variants/peruntukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: peruntukan.nama, category: peruntukan.kategori })
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };

  const removePeruntukan = async (id) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/variants/peruntukan/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };

  const updatePeruntukan = async (id, updatedItem) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/variants/peruntukan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: updatedItem.nama, category: updatedItem.kategori })
      });
      if (response.ok) await refreshVariantsFromApi();
    } catch (err) { console.error(err); }
  };

  const addCategory = async (categoryName) => {
    try {
      const response = await fetch('http://31.97.51.101/api/sales-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: categoryName })
      });
      if (response.ok) {
        await refreshCategoriesFromApi();
      } else {
        const errData = await response.json();
        alert(`Gagal menambah kategori: ${errData.error || response.statusText}`);
      }
    } catch (err) { console.error('Error adding category:', err); }
  };

  const removeCategory = async (id) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/sales-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await refreshCategoriesFromApi();
      }
    } catch (err) { console.error('Error deleting category:', err); }
  };

  const addOrder = (newOrder) => {
    setOrders((prev) => {
      if (newOrder.chassisNumber && newOrder.chassisNumber.trim() !== '' && newOrder.chassisNumber !== '-') {
        const existingIndex = prev.findIndex(o =>
          o.chassisNumber && o.chassisNumber.toLowerCase() === newOrder.chassisNumber.toLowerCase()
        );

        if (existingIndex !== -1) {
          // Add to historyMaintenance of the existing order
          const existingOrder = prev[existingIndex];
          const history = existingOrder.historyMaintenance ? [...existingOrder.historyMaintenance] : [];

          history.push({
            ...newOrder,
            isMaintenance: true
          });

          const updatedOrders = [...prev];
          updatedOrders[existingIndex] = {
            ...existingOrder,
            historyMaintenance: history,
            // We do NOT overwrite the root data as per user request
          };

          return updatedOrders;
        }
      }
      return [...prev, newOrder];
    });
  };

  const completeOrder = (orderId) => {
    setOrders((prev) =>
      prev.map(o => {
        if (o.id === orderId) {
          return { ...o, status: 'Selesai' };
        }
        if (o.historyMaintenance) {
          const updatedHistory = o.historyMaintenance.map(h =>
            h.id === orderId ? { ...h, status: 'Selesai' } : h
          );
          return { ...o, historyMaintenance: updatedHistory };
        }
        return o;
      })
    );
  };

  const updateOrderOperational = async (orderId, updates) => {
    // Cari dbId dari orderId
    const order = orders.find(o => o.id === orderId);
    if (order && order.dbId) {
      try {
        const payload = {
          customer_name: updates.customerName,
          customer_phone: updates.customerHp,
          customer_address: updates.customerAddress,
          car_brand: updates.carBrand,
          car_model: updates.carModel,
          plate_number: updates.plateNumber,
          chassis_number: updates.chassisNumber,
          engine_number: updates.engineNumber,
          car_year: updates.carYear,
          installation_date: updates.installationDate,
          installation_time: updates.installationTime,
          notes: updates.notes
        };
        // Remove undefined fields so we only send what is changed
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        await fetch(`http://31.97.51.101/api/transactions/${order.dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('Error updating transaction in backend:', err);
      }
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, ...updates };
      }
      return o;
    }));
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const settlePayment = async (orderId, amount, method, notes = '', paymentProof = null) => {
    const order = orders.find(o => o.id === orderId);
    let apiSuccess = false;

    if (order && order.dbId) {
      try {
        const response = await fetch(`http://31.97.51.101/api/transactions/${order.dbId}/pay`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: amount,
            paid_amount: amount, // for backward compatibility if any
            payment_method: method,
            notes: notes,
            payment_proof: paymentProof
          })
        });

        if (response.ok) {
          apiSuccess = true;
          await refreshOrdersFromApi();
        }
      } catch (e) {
        console.error('Failed to settle payment on backend:', e);
      }
    }

    if (!apiSuccess) {
      // Fallback optimistic update ONLY if backend update was not successful or dbId is missing
      setOrders(prev => {
        return prev.map(o => {
          if (o.id === orderId) {
            const newPaymentHistory = [...(o.paymentHistory || [])];
            newPaymentHistory.push({
              date: new Date().toISOString(),
              amount: Number(amount),
              method: method || o.paymentMethod || 'Tunai / Cash',
              notes: notes,
              paymentProof: paymentProof
            });
            const historySum = newPaymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
            const newRemaining = Math.max(0, o.totalPrice - historySum);

            return {
              ...o,
              paidAmount: historySum,
              remainingAmount: newRemaining,
              paymentType: newRemaining === 0 ? 'Lunas' : 'DP / Sebagian',
              paymentMethod: method || o.paymentMethod,
              paymentHistory: newPaymentHistory
            };
          }

          if (o.historyMaintenance) {
            const updatedHistory = o.historyMaintenance.map(h => {
              if (h.id === orderId) {
                const newPaymentHistoryH = [...(h.paymentHistory || [])];
                newPaymentHistoryH.push({
                  date: new Date().toISOString(),
                  amount: Number(amount),
                  method: method || h.paymentMethod || 'Tunai / Cash',
                  notes: notes
                });
                const historySumH = newPaymentHistoryH.reduce((sum, p) => sum + Number(p.amount), 0);
                const newRemainingH = Math.max(0, h.totalPrice - historySumH);

                return {
                  ...h,
                  paidAmount: historySumH,
                  remainingAmount: newRemainingH,
                  paymentType: newRemainingH === 0 ? 'Lunas' : 'DP / Sebagian',
                  paymentMethod: method || h.paymentMethod,
                  paymentHistory: newPaymentHistoryH
                };
              }
              return h;
            });
            return { ...o, historyMaintenance: updatedHistory };
          }

          return o;
        });
      });
    }
  };

  // Helper to get end date based on service
  const getEndDate = (startDate, serviceType) => {
    const start = new Date(startDate);
    if (serviceType === 'Kaca Film') {
      return start; // Same day (3 hours)
    } else if (serviceType === 'Coating') {
      return addDays(start, 2); // Up to 2 days
    } else if (serviceType === 'PPF') {
      return addDays(start, 7); // 7 days (1 week)
    }
    return start;
  };

  const getOrderEndDate = (order) => {
    if (order.customEndDate) {
      return new Date(order.customEndDate);
    }
    return getEndDate(order.date, order.serviceType);
  };

  // Check if a date is blocked by active orders (Quota = 3 cars per day)
  const isDateBlocked = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    let activeCount = 0;

    for (const order of orders) {
      if (order.status !== 'Aktif') continue;

      const start = new Date(order.date);
      start.setHours(0, 0, 0, 0);

      const end = getOrderEndDate(order);
      end.setHours(0, 0, 0, 0);

      if (checkDate >= start && checkDate <= end) {
        activeCount++;
      }
    }

    return activeCount >= 3;
  };

  // Flatten orders and historyMaintenance for Dashboards & Calendars
  const flatOrders = orders.reduce((acc, order) => {
    acc.push(order);
    if (order.historyMaintenance && order.historyMaintenance.length > 0) {
      // push each history item, optionally merging top-level customer details if needed
      order.historyMaintenance.forEach(hist => {
        acc.push({
          ...hist,
          customerName: order.customerName,
          customerHp: order.customerHp,
          carBrand: order.carBrand,
          carModel: order.carModel,
          plateNumber: order.plateNumber,
          chassisNumber: order.chassisNumber,
          location: order.location
        });
      });
    }
    return acc;
  }, []);

  const addVehicle = async (vehicleData) => {
    try {
      const response = await fetch('http://31.97.51.101/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(vehicleData)
      });
      if (response.ok) refreshVehiclesFromApi();
    } catch (err) { console.error('Error adding vehicle:', err); }
  };

  const updateVehicle = async (id, vehicleData) => {
    try {
      const response = await fetch(`http://31.97.51.101/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(vehicleData)
      });
      if (response.ok) refreshVehiclesFromApi();
    } catch (err) { console.error('Error updating vehicle:', err); }
  };

  const deleteVehicle = async (id) => {
    try {
      console.log('Attempting to delete vehicle with ID:', id);
      const response = await fetch(`http://31.97.51.101/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Delete response:', response.status);
      if (response.ok) {
        refreshVehiclesFromApi();
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(`Gagal menghapus kendaraan: ${errData.error || response.statusText}`);
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert('Terjadi kesalahan saat menghapus kendaraan.');
    }
  };

  return (
    <OrderContext.Provider value={{
      orders, flatOrders, addOrder, completeOrder, updateOrderOperational, deleteOrder, settlePayment, isDateBlocked, getEndDate, getOrderEndDate, refreshOrdersFromApi,
      categories,
      addCategory,
      removeCategory,
      peruntukanItems,
      addPeruntukan,
      removePeruntukan,
      updatePeruntukan,
      posisiPemasangan, addPosisiPemasangan, removePosisiPemasangan,
      posisiPartial, addPosisiPartial, removePosisiPartial,
      salesItems, addSales, removeSales, updateSales,
      vehicles, addVehicle, updateVehicle, deleteVehicle
    }}
    >
      {children}
    </OrderContext.Provider>
  );
};
