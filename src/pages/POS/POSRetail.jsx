import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PRICING_MATRIX, CAR_BRANDS, formatCurrency, PRODUCT_CATALOG } from '../../data/mockData';
import { useOrders } from '../../context/OrderContext';
import { useInventory } from '../../context/InventoryContext';
import { format } from 'date-fns';
import { Trash2, Plus, Minus, Calculator, Wallet, User, Car, CheckCircle, Package, Search, Tag, Settings, CreditCard, ChevronDown, ChevronRight, Check, CheckSquare, Printer, MessageCircle, X, ShoppingCart, Loader2, FileText, CarFront, Upload, Percent, Banknote, QrCode, Gift } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import SharedInvoice from '../../components/SharedInvoice';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import Select from 'react-select';
import { toast } from 'sonner';
import './POS.css';

const POSRetail = () => {
  const navigate = useNavigate();
  const { userBranch } = useOutletContext() || { userBranch: 'Gallardo' };
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    location: userBranch,
    supplierName: '',
    notes: '',
    customerName: '',
    customerHp: '',
    customerEmail: '',
    customerAddress: '',
    customerCity: '',
    customerProvince: '',
    customerZip: '',
  });

  const [basePrice, setBasePrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3
  const [isDragging, setIsDragging] = useState(false);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [modalVariantState, setModalVariantState] = useState({ satuanBeli: 'Roll', meteranQty: 1, catatan: '' });
  const fileInputRef = useRef(null);

  const [paymentState, setPaymentState] = useState({
    method: 'QRIS',
    type: 'Tanpa DP',
    dpAmount: 0,
    spgName: '',
    billType: 'Reseller (Pembelian Roll)',
    discountType: 'nominal',
    discountValue: 0,
    useTax: false,
    paymentProof: null,
    paymentProofName: '',
    terminCount: '',
    terminNotes: ''
  });

  const { orders, addOrder, isDateBlocked, getEndDate, categories, peruntukanItems, posisiPemasangan, posisiPartial, vehicles } = useOrders();
  const { inventory, processInventoryDeduction } = useInventory();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const customerSearchRef = useRef(null);

  const getUniqueCustomers = () => {
    const unique = [];
    const seen = new Set();
    orders.forEach(o => {
      const name = (o.customerName || o.supplierName || '').trim();
      if (name && name !== 'Pelanggan Umum (Tanpa Nama)' && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        unique.push({
          name: name,
          hp: o.customerHp && o.customerHp !== '-' ? o.customerHp : '',
          address: o.customerAddress && o.customerAddress !== '-' ? o.customerAddress : ''
        });
      }
    });
    return unique;
  };

  const handleCustomerInputFocus = () => {
    const unique = getUniqueCustomers();
    const value = formData.supplierName || '';
    if (value.trim().length > 0) {
      const filtered = unique.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions(unique.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      supplierName: customer.name,
      customerName: customer.name,
      customerHp: customer.hp,
      customerAddress: customer.address
    }));
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showPaymentModal || showInvoiceModal || showVariantModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPaymentModal, showInvoiceModal, showVariantModal]);

  const getProductName = (inv) => {
    if (inv.kategori === 'Tools' || inv.kategori === 'Jasa' || inv.kategori === 'Chemical') return inv.varian;
    return `${inv.brand} ${inv.varian}`.trim();
  };

  const combinedCatalog = inventory.map(inv => ({
    id: inv.id, // Ensure id_barang is carried over
    name: getProductName(inv),
    category: inv.kategori === 'Coating' ? 'Coating & Chemical' : inv.kategori === 'Tools' ? 'Tools & Equipment' : inv.kategori,
    type: inv.kategori === 'Kaca Film' ? 'Kaca Film' : inv.kategori === 'PPF' ? 'PPF' : inv.kategori === 'Coating' ? 'Coating' : 'Tool',
    isVariablePrice: inv.kategori === 'Kaca Film' || inv.kategori === 'PPF',
    price: 0,
    stokUtama: inv.stokUtama,
    stokPecahan: inv.stokPecahan,
    konversi: inv.konversi || 1,
    satuan: inv.satuan,
    trackInventory: true,
    warrantyMonths: inv.kategori === 'PPF' ? 60 : inv.kategori === 'Kaca Film' ? 60 : inv.kategori === 'Coating' ? 36 : 0,
    kegelapan: inv.kegelapan
  }));

  // Category Tabs
  const CATEGORIES = ['Semua', 'Kaca Film', 'PPF', 'Coating & Chemical', 'Tools & Equipment'];
  const filteredProducts = combinedCatalog.filter(p => {
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openVariantModal = (product) => {
    if (product.category !== 'Jasa & Maintenance' && product.category !== 'Tools & Equipment') {
      let konversi = product.konversi || 1;
      if (product.category === 'Kaca Film') konversi = 30;
      else if (product.category === 'PPF') konversi = 15;
      const totalBase = (product.stokUtama * konversi) + (product.stokPecahan || 0);
      if (totalBase <= 0) {
        toast.warning(`Stok ${product.name} kosong!`);
        return;
      }
    } else if (product.category === 'Tools & Equipment') {
      if (product.stokUtama <= 0) {
        toast.warning(`Stok ${product.name} kosong!`);
        return;
      }
    }

    if (product.category === 'Tools & Equipment' || product.category === 'Jasa & Maintenance') {
      addToCart(product);
      return;
    }
    setSelectedProductForModal(product);
    setModalVariantState({ satuanBeli: 'Roll', meteranQty: 1, catatan: '' });
    setShowVariantModal(true);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProductForModal) return;

    const isMeteran = modalVariantState.satuanBeli === 'Meteran (Ecer)';
    const qty = isMeteran ? (modalVariantState.meteranQty || 1) : 1;
    const variantSuffix = isMeteran ? `${qty} Meter` : `1 Roll`;

    const finalName = `${selectedProductForModal.name} (${variantSuffix})`;
    const finalId = `${selectedProductForModal.id}-${isMeteran ? 'meter' : 'roll'}`;

    const productToAdd = {
      ...selectedProductForModal,
      id: finalId, // Frontend unique ID for cart
      id_barang: selectedProductForModal.id, // Original backend inventory ID
      name: finalName,
      baseName: selectedProductForModal.name,
      satuanBeli: modalVariantState.satuanBeli,
      meteranQty: qty,
      isMeteran: isMeteran,
      qty: isMeteran ? qty : 1, // Set initial qty based on selection
      catatan: modalVariantState.catatan || ''
    };

    addToCart(productToAdd);
    setShowVariantModal(false);
    setSelectedProductForModal(null);
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      const requestedQty = product.qty || 1;
      const currentQty = existing ? existing.qty : 0;
      const newTotalQty = currentQty + requestedQty;

      if (product.category !== 'Jasa & Maintenance') {
        let konversi = product.konversi || 1;
        if (product.category === 'Kaca Film') konversi = 30;
        else if (product.category === 'PPF') konversi = 15;
        const totalBaseStock = (product.stokUtama * konversi) + (product.stokPecahan || 0);

        const quantityInBaseUnits = product.isMeteran ? newTotalQty : (newTotalQty * konversi);
        if (quantityInBaseUnits > totalBaseStock) {
          toast.warning(`Stok ${product.baseName || product.name} tidak mencukupi! Sisa: ${product.stokUtama} Roll + ${product.stokPecahan || 0} Meter.`);
          return prev;
        }
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: newTotalQty } : item);
      }
      return [...prev, { ...product, qty: requestedQty }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);

        if (item.category !== 'Jasa & Maintenance') {
          let konversi = item.konversi || 1;
          if (item.category === 'Kaca Film') konversi = 30;
          else if (item.category === 'PPF') konversi = 15;
          const totalBaseStock = (item.stokUtama * konversi) + (item.stokPecahan || 0);

          const quantityInBaseUnits = item.isMeteran ? newQty : (newQty * konversi);
          if (quantityInBaseUnits > totalBaseStock) {
            toast.warning(`Stok ${item.baseName || item.name} tidak mencukupi!`);
            return item;
          }
        }

        return { ...item, qty: newQty };
      }
      return item;
    }));
  };


  const updateCartPrice = (id, newPrice) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, price: Number(newPrice) || 0 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };



  const availableBrands = Array.from(new Set((vehicles || []).map(v => v.brand)));
  const availableModels = (vehicles || []).filter(v => v.brand === formData.carBrand);

  const brandOptions = availableBrands.map(b => ({ value: b, label: b }));
  const modelOptions = availableModels.map(m => ({ value: m.model, label: m.model, size: m.size }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#f9fafb',
      borderColor: state.isFocused ? '#10b981' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
      '&:hover': {
        borderColor: '#10b981'
      },
      padding: '2px',
      borderRadius: '8px'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#e6f7f1' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#10b981'
      }
    })
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'carBrand') {
      setFormData(prev => ({ ...prev, carBrand: value, carModel: '', carSize: '' }));
    } else if (name === 'supplierName') {
      setFormData(prev => ({ ...prev, supplierName: value, customerName: value }));
      const unique = getUniqueCustomers();
      if (value.trim().length > 0) {
        const filtered = unique.filter(c =>
          c.name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions(unique.slice(0, 5));
        setShowSuggestions(true);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBrandSelectChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      carBrand: selectedOption ? selectedOption.value : '',
      carModel: '',
      carSize: ''
    }));
  };

  const handleCRMSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query === '-') {
      setSearchStatus('Silakan masukkan kata kunci pencarian yang valid.');
      return;
    }

    const foundOrder = orders.find(o =>
      (o.customerHp && o.customerHp.toLowerCase().includes(query)) ||
      (o.chassisNumber && o.chassisNumber !== '-' && o.chassisNumber.toLowerCase().includes(query))
    );

    if (foundOrder) {
      setFormData(prev => ({
        ...prev,
        customerName: foundOrder.customerName || '',
        customerHp: foundOrder.customerHp || '',
        customerEmail: foundOrder.customerEmail || '',
        customerAddress: foundOrder.customerAddress || '',
        customerCity: foundOrder.customerCity || '',
        customerProvince: foundOrder.customerProvince || '',
        customerZip: foundOrder.customerZip || '',

      }));
      setSearchStatus('Data Pelanggan Ditemukan & Berhasil Diisi Otomatis!');
    } else {
      setSearchStatus('Data Pelanggan Tidak Ditemukan.');
    }
  };

  const handleModelSelectChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      carModel: selectedOption ? selectedOption.value : ''
    }));
  };

  useEffect(() => {
    let total = 0;
    cartItems.forEach(item => {
      const finalPrice = item.priceOverride !== undefined && item.priceOverride !== '' ? Number(item.priceOverride) : item.price;
      total += finalPrice * item.qty;
    });
    setBasePrice(total);
  }, [cartItems, formData.carSize]);

  const isMaintenanceOrKomplain = cartItems.some(item =>
    item.category === 'Jasa & Maintenance' ||
    (item.product_name && (item.product_name.toLowerCase().includes('maintenance') || item.product_name.toLowerCase().includes('komplain')))
  );

  const sunroofTotal = (parseInt(formData.sunroofQty) || 0) * (parseInt(formData.sunroofPrice) || 0);
  const rawTotalPrice = basePrice + sunroofTotal;
  const discountAmount = paymentState.discountType === 'persen' ? (rawTotalPrice * (paymentState.discountValue / 100)) : (paymentState.discountValue || 0);
  const totalPrice = isMaintenanceOrKomplain ? 0 : Math.max(0, rawTotalPrice - discountAmount);
  const taxAmount = (paymentState.useTax && !isMaintenanceOrKomplain) ? totalPrice * 0.11 : 0;
  const netTotal = isMaintenanceOrKomplain ? 0 : totalPrice + taxAmount;

  let modalPaidAmount = 0;
  if (isMaintenanceOrKomplain) modalPaidAmount = 0;
  else if (paymentState.type === 'Lunas') modalPaidAmount = netTotal;
  else if (paymentState.type === 'Tanpa DP') modalPaidAmount = 0;
  else if (paymentState.type === 'DP 50%') modalPaidAmount = netTotal / 2;
  else if (paymentState.type === 'DP Custom' || paymentState.type === 'Kredit Dagang') modalPaidAmount = paymentState.dpAmount || 0;
  else modalPaidAmount = 0;
  let modalRemainingAmount = Math.max(0, netTotal - modalPaidAmount);

  useEffect(() => {
    if (modalPaidAmount === 0 && paymentState.method !== 'Penagihan') {
      setPaymentState(prev => ({ ...prev, method: 'Penagihan' }));
    }
  }, [modalPaidAmount, paymentState.method]);
  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.location || !formData.carBrand || !formData.carModel || !formData.carSize) {
        alert('Mohon lengkapi Lokasi, Brand, Model, dan Ukuran Kendaraan terlebih dahulu!');
        return;
      }
      if (cartItems.length === 0) {
        alert('Keranjang pesanan masih kosong! Silakan pilih layanan/produk.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.carColor || !formData.plateNumber || !formData.engineNumber || !formData.chassisNumber || !formData.installationDate || !formData.installationTime) {
        alert('Mohon lengkapi Warna Kendaraan, No. Polisi, No. Rangka, No. Mesin, dan Jadwal terlebih dahulu!');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDateBlocked(formData.installationDate)) {
      alert('Maaf, tanggal yang dipilih sudah penuh. Silakan pilih tanggal lain.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentState(prev => ({
          ...prev,
          paymentProof: reader.result,
          paymentProofName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const deductInventory = (cart) => {
    console.log('Deducting inventory for:', cart);
    cart.forEach(item => {
      if (item.trackInventory) {
        console.log(`Decreased stock for ${item.name} by ${item.qty}`);
      }
    });
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);

    try {
      // Simulasi delay jaringan (loading)
      await new Promise(resolve => setTimeout(resolve, 800));

      const finalizedCartItems = cartItems.map(item => {
        let originalPrice = item.price;
        const finalPrice = item.priceOverride !== undefined && item.priceOverride !== '' ? Number(item.priceOverride) : originalPrice;
        const isCustomPrice = finalPrice !== originalPrice;

        return {
          ...item,
          finalPrice: finalPrice,
          originalPrice: originalPrice,
          isCustomPrice: isCustomPrice
        };
      });

      const serviceName = finalizedCartItems.map(item => `${item.name} (x${item.qty})`).join(', ');

      const primaryItem = finalizedCartItems[0];
      const serviceType = primaryItem ? primaryItem.type : 'Lainnya';
      let coatingSeries = '';
      if (serviceType === 'Coating' && primaryItem) {
        if (primaryItem.name.includes('9H')) coatingSeries = 'Nano Ceramic 9H+';
        if (primaryItem.name.includes('14H')) coatingSeries = 'Nano Ceramic 14H';
        if (primaryItem.name.includes('20H')) coatingSeries = 'Nano Ceramic 20H';
      }

      const currentYear = new Date().getFullYear();
      const currentYearRetailOrders = orders.filter(o => o.id && o.id.startsWith(`RTL-${currentYear}-`));

      let nextSequence = 1;
      if (currentYearRetailOrders.length > 0) {
        const sequences = currentYearRetailOrders.map(o => {
          const parts = o.id.split('-');
          return parts.length === 3 ? parseInt(parts[2], 10) : 0;
        }).filter(n => !isNaN(n));

        if (sequences.length > 0) {
          nextSequence = Math.max(...sequences) + 1;
        }
      }
      const paddedSequence = String(nextSequence).padStart(3, '0');
      const generatedInvoiceId = `RTL-${currentYear}-${paddedSequence}`;

      const newOrder = {
        id: generatedInvoiceId,
        ...formData,
        items: finalizedCartItems,
        service: serviceName,
        serviceType: serviceType,
        coatingSeries: coatingSeries,
        totalPrice: netTotal,
        subTotal: rawTotalPrice,
        taxAmount: taxAmount,
        ...paymentState,
        paymentMethod: paymentState.method,
        type: 'RETAIL',
        paymentType: netTotal === 0 ? 'Lunas' : paymentState.type,
        paidAmount: netTotal === 0 ? 0 : modalPaidAmount,
        remainingAmount: netTotal === 0 ? 0 : (netTotal - modalPaidAmount),
        paymentHistory: (netTotal !== 0 && modalPaidAmount > 0) ? [{
          date: new Date().toISOString(),
          amount: modalPaidAmount,
          method: paymentState.method || 'QRIS',
          notes: 'Pembayaran Awal / DP'
        }] : [],
        terminSchedule: (paymentState.type === 'Kredit Dagang' || paymentState.type === 'Kredit Dagang (Credit Term)') && paymentState.terminStartDate ? (() => {
          const hasDP = modalPaidAmount > 0;
          const remainingAmount = netTotal - modalPaidAmount;
          const schedule = [];

          if (hasDP) {
            schedule.push({
              terminIndex: 1,
              dueDate: new Date().toISOString(),
              amount: modalPaidAmount,
              status: 'Lunas'
            });
          }
          schedule.push({
            terminIndex: hasDP ? 2 : 1,
            dueDate: new Date(paymentState.terminStartDate).toISOString(),
            amount: remainingAmount,
            status: 'Belum Bayar'
          });
          return schedule;
        })() : [],
        status: 'Aktif',
        date: new Date().toISOString(),
      };

      const deductResult = processInventoryDeduction(newOrder);

      if (!deductResult.success) {
        toast.error(`Gagal menyimpan transaksi: ${deductResult.message}`);
        return; // prevent checkout
      }

      if (deductResult.alerts && deductResult.alerts.length > 0) {
        deductResult.alerts.forEach(msg => toast.warning(msg));
      }

      // ── Kirim transaksi ke backend (atomik: simpan + potong stok DB) ──

      // ── Kirim transaksi ke backend (atomik: simpan + potong stok DB) ──
      try {
        const salesEventName = paymentState.spgName
          || (user?.name ? user.name.replace(/\s*sales\s*/gi, '').trim() : null);

        const apiPayload = {
          type: 'RETAIL',
          customer_name: formData.supplierName || formData.customerName || 'Pelanggan Umum (Tanpa Nama)',
          customer_phone: formData.customerHp || '-',
          total_amount: netTotal,
          discount: discountAmount,
          sisa_tagihan: (netTotal === 0) ? 0 : Math.max(0, netTotal - modalPaidAmount),
          status_pembayaran: (netTotal === 0 || modalPaidAmount >= netTotal) ? 'Lunas' : 'Belum Bayar',
          event: salesEventName || null,
          payment_type: newOrder.paymentType,
          payment_method: newOrder.paymentMethod,
          termin_schedule: newOrder.terminSchedule,
          notes: newOrder.notes,
          // items — untuk log nama produk di TransactionItem
          items: finalizedCartItems.map(item => ({
            product_name: item.name,
            product_note: item.notes || '',
            price: item.finalPrice,
            quantity: item.qty
          })),
          // inventory_items — untuk memotong stok di tabel Inventory (backend)
          inventory_items: finalizedCartItems
            .filter(item => (item.id_barang || item.id) && String(item.id_barang || item.id).startsWith('INV-'))
            .map(item => {
              const invId = item.id_barang || item.id;
              const invObj = inventory.find(i => i.id === invId);
              let konversi = invObj ? (invObj.konversi || 1) : 1;
              if (invObj && invObj.kategori === 'Kaca Film') konversi = 30;
              else if (invObj && invObj.kategori === 'PPF') konversi = 15;
              const quantityInBaseUnits = item.isMeteran
                ? item.qty
                : (item.qty * konversi);

              return {
                inventory_id: invId,
                quantity: quantityInBaseUnits
              };
            })
        };

        const authToken = token;
        const response = await fetch(window.API_URL + '/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(apiPayload)
        });

        const resJson = await response.json().catch(() => ({}));

        if (!response.ok) {
          // Stok tidak mencukupi atau error backend → batalkan checkout, tampilkan pesan
          const errMsg = resJson.message || resJson.error || 'Gagal sinkronisasi transaksi ke database.';
          toast.error(`❌ ${errMsg}`);
          setIsSubmitting(false);
          return; // STOP — jangan lanjutkan reset cart
        } else {
          // Refresh seluruh data dari backend agar ID dan struktur sama persis
          if (refreshOrdersFromApi) {
            await refreshOrdersFromApi();
          } else {
            addOrder(newOrder);
          }

          // Ambil ID asli dari database jika ada untuk invoice
          if (resJson.data && resJson.data.id) {
            const isRetail = newOrder.billType === 'Retail (Grosir)' || newOrder.type === 'RETAIL';
            const prefix = isRetail ? 'RTL' : 'WRK';
            const dateObj = new Date();
            const yy = String(dateObj.getFullYear()).slice(-2);
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const seqNum = String(resJson.data.id).padStart(4, '0');
            newOrder.id = `${prefix}/${yy}${mm}001${seqNum}`;
          }
        }

        // Peringatan stok menipis dari backend (non-blocking)
        if (resJson.lowStockWarning && resJson.lowStockWarning.length > 0) {
          resJson.lowStockWarning.forEach(w => toast.warning(`⚠️ Stok menipis: ${w}`));
        }
      } catch (err) {
        console.error('Error saat menghubungi API transactions:', err);
        toast.error('Koneksi ke server gagal. Transaksi disimpan lokal saja.');
      }

      toast.success('Transaksi berhasil disimpan & stok telah diperbarui!');

      // 1. State Reset
      setCartItems([]);
      setFormData({
        customerName: '',
        customerHp: '',
        customerAddress: '',
        plateNumber: '',
        carBrand: '',
        carModel: '',
        carYear: '',
        carColor: '',
        carSize: 'Medium'
      });
      setPaymentState({
        method: 'QRIS',
        type: 'Lunas',
        dpAmount: 0,
        spgName: '',
        billType: 'Reseller (Pembelian Roll)',
        useTax: false,
        paymentProof: null,
        paymentProofName: '',
        terminCount: '',
        terminNotes: ''
      });

      // 2. Strictly Closing
      console.log("Transaksi sukses, menutup modal...");
      setShowPaymentModal(false);

      // 3. UI Navigate
      setTimeout(() => {
        navigate('/admin/customer-warranty');
      }, 500);

    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses transaksi.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWA = async () => {
    if (!invoiceData) return;

    const text = `*GALLARDO AUTO SPORT - OFFICIAL INVOICE*
-----------------------------------
*NO INVOICE:* ${invoiceData.id}
*TANGGAL:* ${format(new Date(invoiceData.date), 'dd MMM yyyy HH:mm')}

Terima kasih atas kepercayaan Anda pada Gallardo Auto Sport.
Berikut kami lampirkan dokumen Invoice Anda dalam format PDF.`;
    const waUrl = `https://wa.me/${(invoiceData.customerHp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;

    const element = document.getElementById('invoice-content-to-print');
    if (!element) {
      window.open(waUrl, '_blank');
      return;
    }

    const idOrder = invoiceData.id;
    const safeCustomerName = (invoiceData.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const dynamicFileName = `Invoice_${idOrder}_${safeCustomerName}.pdf`;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, ignoreElements: (el) => el.classList && el.classList.contains('no-print') },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], dynamicFileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceData.id}`,
          text: text
        });
      } else {
        alert("Dokumen PDF Invoice akan diunduh otomatis. Silakan lampirkan file tersebut di WhatsApp.");
        html2pdf().set(opt).from(element).save();
        setTimeout(() => {
          window.open(waUrl, '_blank');
        }, 1500);
      }
    } catch (err) {
      console.error('Error generating PDF', err);
      window.open(waUrl, '_blank');
    }
  };

  const handlePrintPDF = async () => {
    if (!invoiceData) return;

    setIsPrintingInvoice(true);

    const idOrder = invoiceData.id;
    const safeCustomerName = (invoiceData.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const dynamicFileName = `Invoice_${idOrder}_${safeCustomerName}.pdf`;

    const element = document.getElementById('invoice-content-to-print');
    if (!element) {
      setIsPrintingInvoice(false);
      return;
    }

    const opt = {
      margin: 0,
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1024, ignoreElements: (el) => el.classList && el.classList.contains('no-print') },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setIsPrintingInvoice(false);
    }
  };
  const closeInvoiceAndReset = () => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    setCartItems([]);
    setFormData({
      location: userBranch, carBrand: '', sunroofQty: 0, sunroofPrice: 0, carModel: '', carSize: '', carColor: '', plateNumber: '', engineNumber: '', chassisNumber: '', installationDate: new Date().toISOString().split('T')[0], installationTime: '09:00', notes: '', customerName: '', customerHp: '', customerEmail: '', customerAddress: '', customerCity: '', customerProvince: '', customerZip: '',
    });
    setPaymentState({ method: 'QRIS', type: 'Lunas', dpAmount: 0, spgName: '', billType: 'Reseller (Pembelian Roll)', discountType: 'nominal', discountValue: 0, useTax: false, paymentProof: null, paymentProofName: '', terminCount: '', terminNotes: '' });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showVariantModal) setShowVariantModal(false);
        else if (showPaymentModal) setShowPaymentModal(false);
        else if (showInvoiceModal) closeInvoiceAndReset();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showVariantModal, showPaymentModal, showInvoiceModal]);

  return (
    <>
      <div className="pos-page animate-fade-in">
        <div className="page-header no-print">
          <div>
            <h1 className="page-title">POS Retail (Grosir)</h1>
            <p className="page-subtitle">Kasir khusus penjualan barang grosir tanpa layanan bengkel</p>
          </div>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <X size={18} /> Tutup POS
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="pos-layout"
        >
          <div className="pos-forms-container">


            {/* DETAIL SUPPLIER / CUSTOMER */}
            <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 className="font-sans font-bold text-lg mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Detail Customer / Reseller
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={customerSearchRef}>
                  <label className="font-sans text-sm font-semibold mb-2 block">Pilih / Cari Customer</label>
                  <input
                    type="text"
                    name="supplierName"
                    placeholder="Ketik nama Reseller / Toko / Customer..."
                    className="input-field w-full"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    onFocus={handleCustomerInputFocus}
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        zIndex: 1000,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}
                    >
                      {suggestions.map((c, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectCustomer(c)}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            borderBottom: idx < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{c.name}</span>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            WA: {c.hp || '-'} {c.address ? `| Alamat: ${c.address}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-sans text-sm font-semibold mb-2 block">No. WhatsApp</label>
                  <input type="text" name="customerHp" placeholder="08..." className="input-field w-full" value={formData.customerHp} onChange={handleInputChange} />
                </div>

                <div>
                  <label className="font-sans text-sm font-semibold mb-2 block">Alamat (Opsional)</label>
                  <input type="text" name="customerAddress" placeholder="Alamat lengkap..." className="input-field w-full" value={formData.customerAddress} onChange={handleInputChange} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="font-sans text-sm font-semibold mb-2 block">Catatan Pesanan Khusus</label>
                  <textarea
                    name="notes"
                    placeholder="Contoh: Minta cetak banner, packing kayu, dll"
                    className="input-field w-full"
                    rows="3"
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>
            {/* Product Selection */}
            <div className="pos-products-section mt-6">
              <h4 className="font-sans font-semibold text-primary mb-2">Katalog Layanan & Produk</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input
                    type="text"
                    placeholder="Cari nama produk atau brand..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 48px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'box-shadow 0.2s, border-color 0.2s',
                      fontSize: '14px',
                      backgroundColor: '#FFFFFF',
                      color: '#1F2937'
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(79, 70, 229, 0.2)'; e.target.style.borderColor = '#4F46E5'; }}
                    onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Tabs */}
                <div className="category-tabs" style={{ marginBottom: 0 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="products-grid-scroll">
                <div className="products-grid">
                  {filteredProducts.map(product => {
                    let displayPrice = product.price;
                    if (product.isVariablePrice) {
                      const multiplier = formData.carSize === 'Small' ? 1 : formData.carSize === 'Medium' ? 1.2 : formData.carSize === 'Large' ? 1.5 : (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') ? 1.8 : 1;
                      displayPrice = product.price * multiplier;
                    }

                    return (
                      <div key={product.id} className="product-card" onClick={() => openVariantModal(product)}>
                        <div className="p-cat">{product.category}</div>
                        <div className="p-name">{product.name}</div>
                        <div className="p-meta-container">
                          <div className="p-stock" style={{ color: (product.category === 'Tools & Equipment' ? product.stokUtama < 2 : product.stokUtama < 2) ? '#ef4444' : '#6b7280', fontWeight: (product.category === 'Tools & Equipment' ? product.stokUtama < 2 : product.stokUtama < 2) ? '600' : 'normal' }}>
                            <Package size={14} style={{ display: 'inline', marginRight: '4px', opacity: 0.7 }} />
                            {product.trackInventory
                              ? (product.category === 'Tools & Equipment'
                                ? `Tersedia: ${product.stokUtama} ${product.satuan || ''}`
                                : product.category === 'Coating & Chemical'
                                  ? `Tersedia: ${product.stokUtama} Botol (${product.stokPecahan} ml)`
                                  : `Tersedia: ${product.stokUtama} Roll + ${product.stokPecahan} Meter`)
                              : 'Tanpa Stok'}
                          </div>
                          {product.category === 'Kaca Film' && product.kegelapan && (
                            <div className="p-kegelapan">
                              <Percent size={14} style={{ marginRight: '4px', opacity: 0.7 }} />
                              Kegelapan: {product.kegelapan}
                            </div>
                          )}
                        </div>
                        <button className="p-action-btn">Pilih</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Summary */}
          <div className="pos-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Cart Section */}
            <div className="cart-container premium-card" style={{ width: "100%", boxShadow: "none", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
              <h4 className="font-sans font-semibold text-primary mb-2 flex items-center gap-2">
                <FileText size={16} /> Keranjang Pesanan
              </h4>

              {cartItems.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Keranjang kosong.<br />Klik produk untuk menambahkan.
                </div>
              ) : (
                <div className="cart-items">
                  {cartItems.map(item => {
                    let itemPrice = item.price;
                    // No car size multiplier for Retail
                    itemPrice = item.price;
                    const finalPrice = item.priceOverride !== undefined && item.priceOverride !== '' ? item.priceOverride : itemPrice;
                    return (
                      <div key={item.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        <div className="cart-item-name" style={{ lineHeight: '1.4' }}>{item.name}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div className="cart-item-price">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>Rp</span>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '2px 8px', fontSize: '14px', width: '110px', height: '28px', backgroundColor: 'rgba(255,255,255,0.8)' }}
                                value={
                                  (item.priceOverride !== undefined ? item.priceOverride : itemPrice) === ''
                                    ? ''
                                    : Number(item.priceOverride !== undefined ? item.priceOverride : itemPrice).toLocaleString('id-ID')
                                }
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(/\D/g, '');
                                  setCartItems(prev => prev.map(ci => {
                                    if (ci.id === item.id) {
                                      return { ...ci, priceOverride: rawValue === '' ? '' : Number(rawValue) };
                                    }
                                    return ci;
                                  }));
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '') {
                                    setCartItems(prev => prev.map(ci => {
                                      if (ci.id === item.id) {
                                        return { ...ci, priceOverride: itemPrice };
                                      }
                                      return ci;
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="cart-item-actions">
                            <button type="button" className="qty-btn" onClick={() => removeFromCart(item.id)}>
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                            <button type="button" className="qty-btn" onClick={() => updateCartQty(item.id, -1)}><Minus size={12} /></button>
                            <span className="font-sans font-semibold text-sm w-4 text-center">{item.qty}</span>
                            <button type="button" className="qty-btn" onClick={() => updateCartQty(item.id, 1)}><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(basePrice)}</span>
                </div>
              </div>
            </div>

            <div className="summary-card premium-card">
              <div className="section-header">
                <Calculator size={20} />
                <h3 className="font-sans font-semibold">Total Kalkulasi</h3>
              </div>
              <div className="summary-details mt-4">
                <div className="summary-row">
                  <span className="text-secondary">Base Layanan</span>
                  <span className="font-sans font-medium">{formatCurrency(basePrice)}</span>
                </div>
              </div>
              <div className="total-divider"></div>
              <div className="total-row">
                <span className="font-sans text-secondary">Sub Total</span>
                <span className="font-mono-num text-xl font-bold">{formatCurrency(totalPrice)}</span>
              </div>
              <button type="submit" className="btn-primary w-full mt-6" disabled={cartItems.length === 0} style={{ marginBottom: '0.5rem' }}>
                Lanjut ke Pembayaran
              </button>
              {cartItems.length === 0 && (
                <p className="text-xs text-secondary text-center px-2 pt-2" style={{ lineHeight: '1.5' }}>Pilih minimal 1 produk untuk melanjutkan pembayaran.</p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3rem 1rem', overflowY: 'auto' }}>
          <div className="modal-content payment-modal" style={{ width: '850px', maxWidth: '95%', position: 'relative', margin: 'auto', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f8fafc', position: 'relative' }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}><X size={20} /></button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#e0e7ff', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)' }}>
                  <Wallet size={36} color="#4f46e5" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#111827', fontFamily: '"Inter", sans-serif' }}>Checkout Pembayaran</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Selesaikan transaksi dan tentukan metode pembayaran</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '32px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px dashed #d1d5db', marginBottom: '24px' }}>
                <input type="checkbox" id="pajak" checked={paymentState.useTax} onChange={e => setPaymentState(prev => ({ ...prev, useTax: e.target.checked }))} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#4f46e5' }} />
                <label htmlFor="pajak" style={{ fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer', margin: 0, userSelect: 'none' }}>Tambahkan Faktur Pajak (PPN 11%)</label>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ringkasan Finansial</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#4b5563' }}>Sub Total</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{formatCurrency(rawTotalPrice)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Diskon
                      <select
                        value={paymentState.discountType}
                        onChange={(e) => setPaymentState(prev => ({ ...prev, discountType: e.target.value, discountValue: 0 }))}
                        style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', color: '#171717', padding: '4px 8px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="nominal" style={{ color: '#000' }}>Rp</option>
                        <option value="persen" style={{ color: '#000' }}>%</option>
                      </select>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {paymentState.discountType === 'nominal' && <span style={{ fontSize: '14px', fontWeight: '600', color: '#4f46e5' }}>Rp</span>}
                      <input
                        type="text"
                        style={{ width: paymentState.discountType === 'persen' ? '60px' : '130px', padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', color: '#171717', outline: 'none', fontSize: '14px', fontWeight: '600', textAlign: 'right', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#4f46e5'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        value={paymentState.discountValue === 0 ? '' : (paymentState.discountType === 'persen' ? paymentState.discountValue : paymentState.discountValue.toLocaleString('id-ID'))}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          const val = parseInt(rawValue, 10) || 0;
                          let finalVal = val;
                          if (paymentState.discountType === 'persen' && val > 100) finalVal = 100;
                          setPaymentState(prev => ({ ...prev, discountValue: finalVal }));
                        }}
                        placeholder="0"
                      />
                      {paymentState.discountType === 'persen' && <span style={{ fontSize: '14px', fontWeight: '600', color: '#4f46e5' }}>%</span>}
                    </div>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>Total Setelah Diskon</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{formatCurrency(totalPrice)}</span>
                    </div>
                  )}

                  {paymentState.useTax && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>PPN 11%</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444' }}>+ {formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  
                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Net Total Tagihan</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(netTotal)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Telah Dibayar</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>Rp</span>
                      <input
                        type="text"
                        style={{ width: '130px', padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', color: '#171717', outline: 'none', fontSize: '14px', fontWeight: '600', textAlign: 'right', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#10b981'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        value={modalPaidAmount === 0 ? '' : modalPaidAmount.toLocaleString('id-ID')}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '');
                          const val = parseInt(rawValue, 10) || 0;
                          setPaymentState(prev => ({
                            ...prev,
                            type: prev.type === 'Kredit Dagang' && val < netTotal ? 'Kredit Dagang' : (val === netTotal ? 'Lunas' : (val === 0 ? 'Tanpa DP' : 'DP Custom')),
                            dpAmount: val
                          }));
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div style={{ height: '2px', borderBottom: '2px dashed #e5e7eb', margin: '4px 0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>Sisa Tagihan</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>{formatCurrency(modalRemainingAmount)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>Tipe Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  {['Lunas', 'Kredit Dagang', 'DP 50%', 'DP Custom', 'Tanpa DP'].map(type => {
                    const isActive = paymentState.type === type;
                    return (
                      <div 
                        key={type}
                        onClick={() => {
                          if (type === 'Lunas') setPaymentState(prev => ({ ...prev, type, dpAmount: netTotal }));
                          else if (type === 'DP 50%') setPaymentState(prev => ({ ...prev, type, dpAmount: netTotal / 2 }));
                          else if (type === 'Kredit Dagang') setPaymentState(prev => ({ ...prev, type, dpAmount: 0 }));
                          else setPaymentState(prev => ({ ...prev, type, dpAmount: 0 }));
                        }}
                        style={{ 
                          padding: '16px 12px', 
                          borderRadius: '12px', 
                          border: isActive ? '2px solid #4f46e5' : '1px solid #d1d5db', 
                          backgroundColor: isActive ? '#4f46e5' : '#ffffff',
                          color: isActive ? '#ffffff' : '#374151',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '13px',
                          lineHeight: '1.2',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseOver={e => { if(!isActive) { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.backgroundColor = '#f9fafb'; } }}
                        onMouseOut={e => { if(!isActive) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
                      >
                        {type === 'Kredit Dagang' ? 'Kredit Dagang (Credit Term)' : type}
                      </div>
                    )
                  })}
                </div>
                {paymentState.type === 'DP Custom' && (
                  <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
                    <input 
                      type="number" 
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '2px solid #4f46e5', fontSize: '15px', fontWeight: 'bold', color: '#111827', outline: 'none', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)' }}
                      value={paymentState.dpAmount || ''} 
                      onChange={e => setPaymentState(prev => ({ ...prev, dpAmount: parseInt(e.target.value) || 0 }))} 
                      placeholder="Masukkan Nominal DP (Rp)" 
                    />
                  </div>
                )}
                {paymentState.type === 'Kredit Dagang' && (
                  <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>Tanggal Jatuh Tempo (Batas Akhir Pelunasan)</label>
                      <input 
                        type="date" 
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', transition: 'border-color 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#4f46e5'; }}
                        onBlur={e => { e.target.style.borderColor = '#d1d5db'; }}
                        value={paymentState.terminStartDate || ''} 
                        onChange={e => setPaymentState(prev => ({ ...prev, terminStartDate: e.target.value }))} 
                      />
                    </div>
                    {paymentState.terminStartDate && (
                      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4f46e5', marginBottom: '12px' }}>Preview Jadwal Pembayaran</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(() => {
                            const hasDP = modalPaidAmount > 0;
                            const remainingToSplit = netTotal - modalPaidAmount;

                            return (
                              <>
                                {hasDP && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #d1d5db', paddingBottom: '8px' }}>
                                    <span style={{ color: '#6b7280' }}>DP Awal &bull; Saat Ini</span>
                                    <span style={{ fontWeight: '600', color: '#111827' }}>{modalPaidAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: hasDP ? '4px' : '0' }}>
                                  <span style={{ color: '#6b7280' }}>Pelunasan &bull; {new Date(paymentState.terminStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                  <span style={{ fontWeight: '600', color: '#111827' }}>{remainingToSplit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {[
                    { id: 'Penagihan', icon: <FileText size={20} /> },
                    { id: 'QRIS', icon: <QrCode size={20} /> },
                    { id: 'Cash', icon: <Banknote size={20} /> },
                    { id: 'Debit', icon: <CreditCard size={20} /> },
                    { id: 'Kartu Kredit', icon: <CreditCard size={20} /> },
                    { id: 'Transfer Bank', icon: <Banknote size={20} /> },
                    { id: 'Online Shop', icon: <ShoppingCart size={20} /> },
                    { id: 'Free of Charge', icon: <Gift size={20} /> },
                    { id: 'Penawaran', icon: <FileText size={20} /> }
                  ].map(m => {
                    const isActive = paymentState.method === m.id;
                    const isDisabled = modalPaidAmount === 0 && m.id !== 'Penagihan';
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => { if(!isDisabled) setPaymentState(prev => ({ ...prev, method: m.id })) }}
                        style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '16px 12px', 
                          borderRadius: '12px', 
                          border: isActive ? '2px solid #4f46e5' : '1px solid #e5e7eb', 
                          backgroundColor: isActive ? '#eef2ff' : '#ffffff',
                          color: isActive ? '#4f46e5' : '#6b7280',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: isDisabled ? 0.4 : 1,
                          filter: isDisabled ? 'grayscale(100%)' : 'none'
                        }}
                        onMouseOver={e => { if(!isActive && !isDisabled) { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.backgroundColor = '#f8fafc'; } }}
                        onMouseOut={e => { if(!isActive && !isDisabled) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
                      >
                        <div style={{ color: isActive ? '#4f46e5' : '#9ca3af', transition: 'color 0.2s' }}>
                          {m.icon}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', textAlign: 'center', lineHeight: '1.2' }}>{m.id}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>
                  <Upload size={16} color="#6b7280" /> Upload Bukti Pembayaran
                </label>

                {!paymentState.paymentProofName ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPaymentState(prev => ({ ...prev, paymentProof: reader.result, paymentProofName: file.name }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ 
                      border: isDragging ? '2px dashed #4f46e5' : '2px dashed #d1d5db', 
                      borderRadius: '16px', 
                      padding: '40px 24px', 
                      textAlign: 'center', 
                      backgroundColor: isDragging ? '#eef2ff' : '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.backgroundColor = '#eef2ff'; }}
                    onMouseOut={e => { if(!isDragging) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#f9fafb'; } }}
                  >
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,application/pdf" onChange={handleFileUpload} />
                    <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <Upload size={24} color="#4f46e5" />
                    </div>
                    <div>
                      <p style={{ color: '#374151', fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>Klik untuk upload atau drag and drop</p>
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Maksimal ukuran file: 5MB (JPG, PNG, PDF)</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#10b981', padding: '12px', borderRadius: '8px' }}>
                      <FileText size={24} color="#ffffff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#065f46', fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{paymentState.paymentProofName}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={14} color="#10b981" />
                        <span style={{ color: '#059669', fontSize: '12px', fontWeight: '500' }}>File siap diunggah</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPaymentState(prev => ({ ...prev, paymentProof: null, paymentProofName: '' }));
                      }}
                      style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #f3f4f6', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.5 : 1, padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#4b5563', backgroundColor: '#ffffff', border: '1px solid #d1d5db', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseOver={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#f9fafb' }}
                onMouseOut={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#ffffff' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: '#4f46e5', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseOver={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#4338ca' }}
                onMouseOut={e => { if(!isSubmitting) e.currentTarget.style.backgroundColor = '#4f46e5' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Konfirmasi Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={closeInvoiceAndReset}>
          <div className="w-[95vw] max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col relative" style={{ maxHeight: '90vh', minWidth: 0, minHeight: 0 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close no-print absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center text-gray-600 shadow-md transition-colors" onClick={closeInvoiceAndReset}><X size={24} /></button>
            <div className="flex-1 p-4 md:p-8 print:!overflow-visible" style={{ backgroundColor: '#e5e7eb', overflowY: 'auto', overflowX: 'auto', minWidth: 0, minHeight: 0 }}>
              <div className="invoice-preview-wrapper" style={{ width: 'max-content', margin: '0 auto' }}>
                <SharedInvoice order={invoiceData} />
              </div>
            </div>

            <div className="invoice-actions no-print p-4 md:p-6 border-t bg-gray-50 rounded-b-lg flex flex-wrap gap-4">
              <button
                className="flex-1 flex justify-center items-center gap-2"
                style={{ backgroundColor: '#f3f4f6', color: '#111', padding: '10px', borderRadius: '8px', fontWeight: 'bold', minWidth: '140px', cursor: isPrintingInvoice ? 'wait' : 'pointer', opacity: isPrintingInvoice ? 0.7 : 1 }}
                onClick={handlePrintPDF}
                disabled={isPrintingInvoice}
              >
                {isPrintingInvoice ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                {isPrintingInvoice ? 'Mencetak...' : 'Cetak Invoice'}
              </button>
              <button className="flex-1 flex justify-center items-center gap-2" style={{ backgroundColor: '#25D366', color: '#fff', padding: '10px', borderRadius: '8px', fontWeight: 'bold', minWidth: '140px' }} onClick={handleShareWA}>
                <MessageCircle size={18} /> Share WA
              </button>
              <button className="flex-1 flex justify-center items-center gap-2" style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '8px', fontWeight: 'bold', minWidth: '140px' }} onClick={closeInvoiceAndReset}>
                <CheckCircle size={18} /> Selesai (Buat Baru)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {showVariantModal && selectedProductForModal && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content animate-fade-in" style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ flexShrink: 0, padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <h2 className="font-sans font-bold mb-1" style={{ color: '#111', fontSize: '1.75rem', margin: 0 }}>{selectedProductForModal.name}</h2>
              <p className="text-sm m-0 mt-1" style={{ color: '#6b7280', fontSize: '1rem', margin: 0, marginTop: '4px' }}>Silakan pilih opsi sebanyak yang Anda butuhkan, Anda dapat mengubahnya nanti di keranjang.</p>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
              <div style={{ marginBottom: '24px' }}>
                <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>SATUAN PEMBELIAN</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {['Roll', 'Meteran (Ecer)'].map(val => (
                    <div key={val} onClick={() => setModalVariantState(prev => ({ ...prev, satuanBeli: val }))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: modalVariantState.satuanBeli === val ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: modalVariantState.satuanBeli === val ? '#eef2ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <span style={{ fontWeight: 'bold', color: modalVariantState.satuanBeli === val ? '#3730a3' : '#111', fontSize: '15px' }}>{val === 'Roll' ? 'Beli per Roll' : 'Beli Meteran (Ecer)'}</span>
                      {modalVariantState.satuanBeli === val ? <CheckCircle size={20} color="#6366f1" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #d1d5db' }}></div>}
                    </div>
                  ))}
                </div>
              </div>

              {modalVariantState.satuanBeli === 'Meteran (Ecer)' && (
                <div style={{ marginBottom: '24px' }}>
                  <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Masukkan jumlah meter</label>
                  <input
                    type="number"
                    min="1"
                    value={modalVariantState.meteranQty}
                    onChange={(e) => setModalVariantState(prev => ({ ...prev, meteranQty: parseInt(e.target.value) || 1 }))}
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
                    placeholder="Contoh: 5"
                  />
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Catatan Produk (Opsional)</label>
                <textarea
                  placeholder="Contoh: Harap hati-hati pada bagian tertentu..."
                  value={modalVariantState.catatan || ''}
                  onChange={(e) => setModalVariantState(prev => ({ ...prev, catatan: e.target.value }))}
                  style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyItems: 'center', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f9fafb' }}>
              <button
                type="button"
                style={{ padding: '10px 20px', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setShowVariantModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                style={{ padding: '10px 20px', color: '#ffffff', backgroundColor: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={handleAddToCartFromModal}
              >
                Lanjutkan &gt;
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};
export default POSRetail;
