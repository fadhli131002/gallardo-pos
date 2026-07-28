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

const POS = () => {
  const navigate = useNavigate();
  const { userBranch } = useOutletContext() || { userBranch: 'Gallardo' };
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    // Section 1: Brand & Layanan
    location: userBranch,
    carBrand: '',
    sunroofQty: 0,
    sunroofPrice: 0,

    // Section 2: Car Info
    carModel: '',
    carSize: '',
    carColor: '',
    plateNumber: '',
    engineNumber: '',
    chassisNumber: '',
    installationDate: new Date().toISOString().split('T')[0],
    installationTime: '09:00',
    notes: '',

    // Section 4: Customer Info
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
  const [cartItems, setCartItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [modalVariantState, setModalVariantState] = useState({ posisi: '', peruntukan: '', catatan: '' });
  const [formErrors, setFormErrors] = useState([]);
  const fileInputRef = useRef(null);

  const [discount, setDiscount] = useState(0);
  const [paymentState, setPaymentState] = useState({
    method: 'QRIS',
    type: 'Lunas',
    dpAmount: 0,
    spgName: '',
    billType: 'Walk-In (Workshop)',
    useTax: false,
    paymentProof: null,
    paymentProofName: ''
  });

  const { orders, addOrder, isDateBlocked, getEndDate, categories, peruntukanItems, posisiPemasangan, posisiPartial, salesItems, vehicles } = useOrders();
  const { inventory, consumeStock, deductStock, deductRetailStock } = useInventory();

  const getProductName = (inv) => {
    if (inv.kategori === 'Tools' || inv.kategori === 'Jasa' || inv.kategori === 'Chemical') return inv.varian;
    return `${inv.brand} ${inv.varian}`.trim();
  };

  const combinedCatalog = [
    ...inventory.map(inv => ({
      id: inv.id,
      id_barang: inv.id,
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
    })),
    ...PRODUCT_CATALOG
  ];

  // Category Tabs
  const CATEGORIES = ['Semua', 'Kaca Film', 'PPF', 'Coating & Chemical', 'Jasa & Maintenance', 'Tools & Equipment'];
  const filteredProducts = combinedCatalog.filter(p => {
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openVariantModal = (product) => {
    if (product.category === 'Tools & Equipment' || product.category === 'Jasa & Maintenance') {
      addToCart(product);
      return;
    }
    setSelectedProductForModal(product);
    setModalVariantState({ posisi: '', peruntukan: '', catatan: '' });
    setShowVariantModal(true);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedProductForModal) return;

    let variantSuffix = '';
    const cat = selectedProductForModal.category;

    if (cat === 'Kaca Film') {
      if (!modalVariantState.posisi) {
        alert('Mohon pilih Posisi Pemasangan');
        return;
      }
      variantSuffix = `${modalVariantState.posisi}`;
    } else if (cat === 'PPF' || cat === 'Coating & Chemical') {
      if (!modalVariantState.peruntukan) {
        alert('Mohon pilih Peruntukan');
        return;
      }
      variantSuffix = `${modalVariantState.peruntukan}`;
    }

    const finalName = variantSuffix ? `${selectedProductForModal.name} (${variantSuffix})` : selectedProductForModal.name;
    const finalId = variantSuffix ? `${selectedProductForModal.id}-${variantSuffix.replace(/[^a-zA-Z0-9]/g, '')}` : selectedProductForModal.id;

    const productToAdd = {
      ...selectedProductForModal,
      id: finalId, // Frontend unique ID for cart
      id_barang: selectedProductForModal.id, // Original backend inventory ID
      name: finalName,
      baseName: selectedProductForModal.name,
      posisi: modalVariantState.posisi || '',
      peruntukan: modalVariantState.peruntukan || '',
      catatan: modalVariantState.catatan || ''
    };

    if (selectedProductForModal.category !== 'Jasa & Maintenance' && selectedProductForModal.category !== 'Tools & Equipment') {
      let konversi = selectedProductForModal.konversi || 1;
      if (selectedProductForModal.category === 'Kaca Film') konversi = 30;
      else if (selectedProductForModal.category === 'PPF') konversi = 15;
      const totalBase = (selectedProductForModal.stokUtama * konversi) + (selectedProductForModal.stokPecahan || 0);

      let baseDeduct = 1;
      if (selectedProductForModal.category === 'PPF' || selectedProductForModal.name?.toUpperCase().includes('VANSGARD') || selectedProductForModal.name?.toUpperCase().includes('PPF')) {
        if (formData.carSize === 'Small' || formData.carSize === 'Medium') baseDeduct = 15;
        else if (formData.carSize === 'Large') baseDeduct = 17;
        else if (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') baseDeduct = 18;
        else baseDeduct = 15;
      } else if (selectedProductForModal.category === 'Coating & Chemical' || selectedProductForModal.name?.toUpperCase().includes('COATING') || selectedProductForModal.name?.toUpperCase().includes('RANTIZ')) {
        baseDeduct = 17;
      } else if (selectedProductForModal.category === 'Kaca Film' || selectedProductForModal.name?.toUpperCase().includes('KACA FILM') || selectedProductForModal.name?.toUpperCase().includes('PERFORMANTE') || selectedProductForModal.name?.toUpperCase().includes('DELUXE')) {
        baseDeduct = 4;
      }

      if (totalBase < baseDeduct) {
        toast.warning(`Stok ${selectedProductForModal.name} tidak mencukupi! Dibutuhkan min: ${baseDeduct} satuan dasar, Tersedia: ${totalBase} satuan dasar.`);
        return;
      }
    }

    addToCart(productToAdd);
    setShowVariantModal(false);
    setSelectedProductForModal(null);
  };

  const addToCart = (product) => {
    const itemToAdd = {
      ...product,
      id_barang: product.id_barang || product.id
    };
    setCartItems(prev => {
      const existing = prev.find(item => item.id === itemToAdd.id);
      const newQty = existing ? existing.qty + 1 : 1;

      if (itemToAdd.category !== 'Jasa & Maintenance') {
        let konversi = itemToAdd.konversi || 1;
        if (itemToAdd.category === 'Kaca Film') konversi = 30;
        else if (itemToAdd.category === 'PPF') konversi = 15;
        const totalBase = (itemToAdd.stokUtama * konversi) + (itemToAdd.stokPecahan || 0);

        let baseDeduct = 1;
        if (itemToAdd.category === 'PPF' || itemToAdd.name?.toUpperCase().includes('VANSGARD') || itemToAdd.name?.toUpperCase().includes('PPF')) {
          if (formData.carSize === 'Small' || formData.carSize === 'Medium') baseDeduct = 15;
          else if (formData.carSize === 'Large') baseDeduct = 17;
          else if (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') baseDeduct = 18;
          else baseDeduct = 15;
        } else if (itemToAdd.category === 'Coating & Chemical' || itemToAdd.name?.toUpperCase().includes('COATING') || itemToAdd.name?.toUpperCase().includes('RANTIZ')) {
          baseDeduct = 17;
        } else if (itemToAdd.category === 'Kaca Film' || itemToAdd.name?.toUpperCase().includes('KACA FILM') || itemToAdd.name?.toUpperCase().includes('PERFORMANTE') || itemToAdd.name?.toUpperCase().includes('DELUXE')) {
          baseDeduct = 4;
        }

        const requiredStock = baseDeduct * newQty;

        if (itemToAdd.category === 'Tools & Equipment' && newQty > (itemToAdd.stokUtama || 0)) {
          toast.warning(`Stok ${itemToAdd.name} tidak mencukupi!`);
          return prev;
        } else if (requiredStock > totalBase && itemToAdd.category !== 'Tools & Equipment') {
          toast.warning(`Stok ${itemToAdd.name} tidak mencukupi! Dibutuhkan: ${requiredStock} satuan dasar, Tersedia: ${totalBase} satuan dasar.`);
          return prev;
        }
      }

      if (existing) {
        return prev.map(item => item.id === itemToAdd.id ? { ...item, qty: newQty } : item);
      }
      return [...prev, { ...itemToAdd, qty: 1 }];
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
          const totalBase = (item.stokUtama * konversi) + (item.stokPecahan || 0);

          let baseDeduct = 1;
          if (item.category === 'PPF' || item.name?.toUpperCase().includes('VANSGARD') || item.name?.toUpperCase().includes('PPF')) {
            if (formData.carSize === 'Small' || formData.carSize === 'Medium') baseDeduct = 15;
            else if (formData.carSize === 'Large') baseDeduct = 17;
            else if (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') baseDeduct = 18;
            else baseDeduct = 15;
          } else if (item.category === 'Coating & Chemical' || item.name?.toUpperCase().includes('COATING') || item.name?.toUpperCase().includes('RANTIZ')) {
            baseDeduct = 17;
          } else if (item.category === 'Kaca Film' || item.name?.toUpperCase().includes('KACA FILM') || item.name?.toUpperCase().includes('PERFORMANTE') || item.name?.toUpperCase().includes('DELUXE')) {
            baseDeduct = 4;
          }

          const requiredStock = baseDeduct * newQty;

          if (item.category === 'Tools & Equipment' && newQty > (item.stokUtama || 0)) {
            toast.warning(`Stok ${item.name} tidak mencukupi!`);
            return item;
          } else if (requiredStock > totalBase && item.category !== 'Tools & Equipment') {
            toast.warning(`Stok ${item.name} tidak mencukupi! Dibutuhkan: ${requiredStock} satuan dasar, Tersedia: ${totalBase} satuan dasar.`);
            return item;
          }
        }

        return { ...item, qty: newQty };
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
        carBrand: foundOrder.carBrand || '',
        carModel: foundOrder.carModel || '',
        carSize: foundOrder.carSize || '',
        carColor: foundOrder.carColor || '',
        plateNumber: foundOrder.plateNumber || '',
        engineNumber: foundOrder.engineNumber || '',
        chassisNumber: foundOrder.chassisNumber || '',
        carYear: foundOrder.carYear || '',
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
      let itemPrice = item.price;
      // Modifier harga untuk Kaca Film & PPF berdasarkan ukuran mobil
      if (item.isVariablePrice) {
        const multiplier = formData.carSize === 'Small' ? 1 : formData.carSize === 'Medium' ? 1.2 : formData.carSize === 'Large' ? 1.5 : (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') ? 1.8 : 1;
        itemPrice = item.price * multiplier;
      }
      const finalPrice = item.priceOverride !== undefined && item.priceOverride !== '' ? Number(item.priceOverride) : itemPrice;
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
  const totalPrice = isMaintenanceOrKomplain ? 0 : rawTotalPrice;
  const discountAmount = Number(discount) || 0;
  const taxAmount = (paymentState.useTax && !isMaintenanceOrKomplain) ? (totalPrice - discountAmount) * 0.11 : 0;
  const netTotal = isMaintenanceOrKomplain ? 0 : Math.max(0, totalPrice - discountAmount + taxAmount);

  let modalPaidAmount = 0;
  if (isMaintenanceOrKomplain) modalPaidAmount = 0;
  else if (paymentState.type === 'Lunas') modalPaidAmount = netTotal;
  else if (paymentState.type === 'Tanpa DP') modalPaidAmount = 0;
  else if (paymentState.type === 'DP Custom') modalPaidAmount = paymentState.dpAmount || 0;
  else modalPaidAmount = netTotal / 2;

  let modalRemainingAmount = netTotal - modalPaidAmount;

  const nextStep = () => {
    if (currentStep === 1) {
      const errors = [];
      if (!formData.location) errors.push('Lokasi Pasang');
      if (!formData.carBrand) errors.push('Brand Mobil');
      if (!formData.carModel) errors.push('Model Kendaraan');
      if (!formData.carSize) errors.push('Ukuran Kendaraan');

      if (errors.length > 0) {
        setFormErrors(errors);
        console.log('Form Errors:', errors);
        toast.error('Harap lengkapi data yang ditandai merah');

        const errorIdMap = {
          'Lokasi Pasang': 'input-lokasi',
          'Brand Mobil': 'input-brand',
          'Model Kendaraan': 'input-model',
          'Ukuran Kendaraan': 'input-ukuran'
        };
        const firstErrorId = errorIdMap[errors[0]];
        setTimeout(() => {
          document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }

      if (cartItems.length === 0) {
        toast.error('Keranjang pesanan masih kosong! Silakan pilih layanan/produk.');
        return;
      }

      setFormErrors([]);
    } else if (currentStep === 2) {
      const errors = [];
      if (!formData.carColor) errors.push('Warna Kendaraan');
      if (!formData.plateNumber) errors.push('Nomor Polisi');
      if (!formData.chassisNumber) errors.push('No. Rangka');
      if (!formData.engineNumber) errors.push('Nomor Mesin');
      if (!formData.installationDate) errors.push('Estimasi Tanggal');
      if (!formData.installationTime) errors.push('Estimasi Waktu');

      if (errors.length > 0) {
        setFormErrors(errors);
        toast.error('Harap lengkapi data yang ditandai merah');
        return;
      }
      setFormErrors([]);
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Keranjang pesanan masih kosong! Silakan pilih layanan/produk.');
      return;
    }
    const errors = [];
    if (!formData.customerName) errors.push('Nama Lengkap');
    if (!formData.customerHp) errors.push('Nomor Telepon');
    if (!formData.customerAddress) errors.push('Alamat Lengkap');

    if (errors.length > 0) {
      setFormErrors(errors);
      console.log('Form Errors:', errors);
      toast.error('Harap lengkapi data yang ditandai merah');
      const errorIdMap = {
        'Nama Lengkap': 'input-customerName',
        'Nomor Telepon': 'input-customerHp',
        'Alamat Lengkap': 'input-customerAddress'
      };
      const firstErrorId = errorIdMap[errors[0]];
      setTimeout(() => {
        document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
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


  const handleDeductInventory = (cart, isRetail) => {
    cart.forEach(item => {
      if (item.trackInventory) {
        let realInventoryId = item.id_barang;
        if (!realInventoryId && typeof item.id === 'string') {
          const match = item.id.match(/(INV-\d+)/);
          if (match) realInventoryId = match[1];
        }
        if (!realInventoryId) realInventoryId = item.id;

        if (isRetail) {
          deductRetailStock(realInventoryId, item.qty);
        } else {
          // For workshop, deduct based on car size
          let deductionAmount = 1;

          if (item.category === 'PPF' || item.name?.toUpperCase().includes('VANSGARD') || item.name?.toUpperCase().includes('PPF')) {
            if (formData.carSize === 'Small' || formData.carSize === 'Medium') deductionAmount = 15; // 15 Meters
            else if (formData.carSize === 'Large') deductionAmount = 17; // 17 Meters
            else if (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') deductionAmount = 18; // 18 Meters
            else deductionAmount = 15;
          } else if (item.category === 'Coating & Chemical' || item.name?.toUpperCase().includes('COATING') || item.name?.toUpperCase().includes('RANTIZ')) {
            // 50ml for 3 cars -> ~17ml per car (rounded from 16.67ml)
            deductionAmount = 17;
          } else if (item.category === 'Kaca Film' || item.name?.toUpperCase().includes('KACA FILM') || item.name?.toUpperCase().includes('PERFORMANTE') || item.name?.toUpperCase().includes('DELUXE')) {
            deductionAmount = 4; // 4 Meters standard for full body Kaca Film
          } else {
            deductionAmount = 1;
          }

          deductStock(realInventoryId, deductionAmount * (item.qty || 1));
        }
      }
    });
  };

  const handleConfirmPayment = async () => {
    const finalizedCartItems = cartItems.map(item => {
      let originalPrice = item.price;
      if (item.isVariablePrice) {
        const multiplier = formData.carSize === 'Small' ? 1 : formData.carSize === 'Medium' ? 1.2 : formData.carSize === 'Large' ? 1.5 : (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') ? 1.8 : 1;
        originalPrice = item.price * multiplier;
      }
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

    const newOrder = {
      id: `WRK/300260700${Math.floor(Math.random() * 9000) + 1000}`,
      ...formData,
      items: finalizedCartItems,
      service: serviceName,
      serviceType: serviceType,
      coatingSeries: coatingSeries,
      totalPrice: netTotal,
      subTotal: rawTotalPrice,
      discountAmount: discountAmount,
      taxAmount: taxAmount,
      ...paymentState,
      paymentMethod: paymentState.method,
      type: netTotal === 0 ? 'Lunas' : paymentState.type,
      paymentType: netTotal === 0 ? 'Lunas' : paymentState.type,
      paidAmount: netTotal === 0 ? 0 : modalPaidAmount,
      remainingAmount: netTotal === 0 ? 0 : (netTotal - modalPaidAmount),
      status: 'Aktif',
      date: new Date(`${formData.installationDate}T${formData.installationTime}:00`).toISOString()
    };
    // ── Sinkronisasi Workshop Order ke backend DB (event + potong stok) ──
    try {
      const salesEventName = paymentState.spgName
        || (user?.name ? user.name.replace(/\s*sales\s*/gi, '').trim() : null);

      // Hitung qty pemotongan stok berdasarkan ukuran mobil
      const carSizeDeductMap = {
        'Small': 2, 'Medium': 3, 'Large': 4, 'Extra Large / Supercar': 5, 'XL/Luxury': 5
      };

      const apiPayload = {
        customer_name: formData.customerName || 'Pelanggan Umum (Tanpa Nama)',
        customer_phone: formData.customerHp || '-',
        customer_address: formData.customerAddress || null,
        car_brand: formData.carBrand || null,
        car_model: formData.carModel || null,
        plate_number: formData.plateNumber || null,
        chassis_number: formData.chassisNumber || null,
        car_year: formData.carYear || null,
        installation_date: formData.installationDate || null,
        installation_time: formData.installationTime || null,
        total_amount: newOrder.totalPrice,
        sisa_tagihan: newOrder.remainingAmount || 0,
        status_pembayaran: newOrder.paymentType === 'Lunas' ? 'Lunas' : 'Proses',
        event: salesEventName || null,
        payment_type: newOrder.paymentType || null,
        payment_method: paymentState.method || null,
        payment_proof: paymentState.paymentProof || null,
        items: finalizedCartItems.map(item => ({
          product_name: item.name,
          product_note: item.notes || '',
          price: item.finalPrice,
          quantity: item.qty || 1
        })),
        // Untuk workshop, potong stok berdasarkan ukuran mobil & qty item
        inventory_items: finalizedCartItems
          .filter(item => item.trackInventory)
          .map(item => {
            // ✅ PERBAIKAN: Selalu utamakan item.id_barang, jika tidak ada baru ambil format INV- dari item.id
            let realInventoryId = item.id_barang;
            if (!realInventoryId && typeof item.id === 'string') {
              const match = item.id.match(/(INV-\d+)/);
              if (match) realInventoryId = match[1];
            }
            // Fallback terakhir jika masih berupa string langsung
            if (!realInventoryId) {
              realInventoryId = item.id;
            }

            let baseDeduct = 1;
            if (item.category === 'PPF' || item.name?.toUpperCase().includes('VANSGARD') || item.name?.toUpperCase().includes('PPF')) {
              if (formData.carSize === 'Small' || formData.carSize === 'Medium') baseDeduct = 15;
              else if (formData.carSize === 'Large') baseDeduct = 17;
              else if (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') baseDeduct = 18;
              else baseDeduct = 15;
            } else if (item.category === 'Coating & Chemical' || item.name?.toUpperCase().includes('COATING') || item.name?.toUpperCase().includes('RANTIZ')) {
              baseDeduct = 17; // 17ml rounded
            } else if (item.category === 'Kaca Film' || item.name?.toUpperCase().includes('KACA FILM') || item.name?.toUpperCase().includes('PERFORMANTE') || item.name?.toUpperCase().includes('DELUXE')) {
              baseDeduct = 4; // 4 Meters standard
            }

            return {
              inventory_id: realInventoryId,
              quantity: baseDeduct * (item.qty || 1)
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
        const errMsg = resJson.message || 'Gagal menyimpan ke database backend.';
        toast.error(`❌ ${errMsg}`);
        setIsSubmitting(false);
        return; // Batalkan checkout
      } else {
        // Refresh seluruh data dari backend agar ID dan struktur sama persis
        if (refreshOrdersFromApi) {
          await refreshOrdersFromApi();
        } else {
          addOrder(newOrder); // Fallback
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

        // Peringatan stok menipis
        if (resJson.lowStockWarning && resJson.lowStockWarning.length > 0) {
          resJson.lowStockWarning.forEach(w => toast.warning(`⚠️ Stok menipis: ${w}`));
        }
      }
    } catch (err) {
      console.error('Error sync workshop order to backend:', err);
    }

    const isRetail = newOrder.billType === 'Retail (Grosir)' || newOrder.type === 'RETAIL';
    handleDeductInventory(cartItems, isRetail);

    setShowPaymentModal(false);
    setInvoiceData(newOrder);
    setShowInvoiceModal(true);
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
    setPaymentState({ method: 'QRIS', type: 'Lunas', dpAmount: 0, spgName: '', billType: 'Walk-In (Workshop)', useTax: false, paymentProof: null, paymentProofName: '' });
    setDiscount(0);
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
            <h1 className="page-title">Point of Sale (Service & Retail)</h1>
            <p className="page-subtitle">Sistem kasir, pembuatan SPK, dan pembayaran</p>
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

            {/* Step 1: Layanan & Brand */}
            {currentStep === 1 && (
              <>
                {/* CRM Search */}
                <div className="form-section premium-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-header">
                    <Search size={20} />
                    <h3 className="font-sans font-semibold">Pencarian Pelanggan Lama (CRM)</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder="Masukkan No. WhatsApp atau No. Rangka (VIN)..."
                          className="input-field"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="btn-primary" onClick={handleCRMSearch} style={{ padding: '0.75rem 1.5rem' }}>Cari</button>
                      </div>
                      {searchStatus && <p className="text-sm mt-2 font-semibold" style={{ color: searchStatus.includes('Ditemukan') ? '#10b981' : '#ef4444' }}>{searchStatus}</p>}
                    </div>
                  </div>
                </div>

                <div className="form-section premium-card animate-fade-in">
                  <div className="section-header">
                    <FileText size={20} />
                    <h3 className="font-sans font-semibold">Step 1: Brand & Layanan</h3>
                  </div>
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }} id="input-lokasi">
                      <label className="font-mono-ui text-sm text-secondary">Lokasi Pasang</label>
                      <select name="location" value={formData.location} disabled className="input-field" style={{ cursor: 'not-allowed', borderColor: formErrors.includes('Lokasi Pasang') ? '#ef4444' : undefined, backgroundColor: formErrors.includes('Lokasi Pasang') ? '#fef2f2' : '#f3f4f6', borderWidth: formErrors.includes('Lokasi Pasang') ? '2px' : undefined }}>
                        <option value={userBranch}>{userBranch}</option>
                      </select>
                      {formErrors.includes('Lokasi Pasang') && <p className="text-red-500 text-xs mt-1">Wajib diisi</p>}
                    </div>
                    <div className="form-group" id="input-brand">
                      <label className="font-mono-ui text-sm text-secondary">Brand Mobil</label>
                      <Select
                        options={brandOptions}
                        value={brandOptions.find(opt => opt.value === formData.carBrand) || null}
                        onChange={handleBrandSelectChange}
                        placeholder="-- Ketik atau Pilih Brand --"
                        styles={{
                          ...customSelectStyles,
                          control: (base, state) => ({
                            ...customSelectStyles.control(base, state),
                            ...(formErrors.includes('Brand Mobil') && {
                              borderColor: '#ef4444',
                              backgroundColor: '#fef2f2',
                              borderWidth: '2px',
                            })
                          })
                        }}
                        isSearchable={true}
                        isClearable={true}
                        noOptionsMessage={() => "Brand tidak ditemukan"}
                      />
                      {formErrors.includes('Brand Mobil') && <p className="text-red-500 text-xs mt-1">Wajib diisi</p>}
                    </div>
                    <div className="form-group" id="input-model">
                      <label className="font-mono-ui text-sm text-secondary">Model Kendaraan</label>
                      <Select
                        options={modelOptions}
                        value={modelOptions.find(opt => opt.value === formData.carModel) || null}
                        onChange={handleModelSelectChange}
                        placeholder="-- Ketik atau Pilih Model --"
                        styles={{
                          ...customSelectStyles,
                          control: (base, state) => ({
                            ...customSelectStyles.control(base, state),
                            ...(formErrors.includes('Model Kendaraan') && {
                              borderColor: '#ef4444',
                              backgroundColor: '#fef2f2',
                              borderWidth: '2px',
                            })
                          })
                        }}
                        isDisabled={!formData.carBrand}
                        isSearchable={true}
                        isClearable={true}
                        noOptionsMessage={() => "Model tidak ditemukan"}
                      />
                      {formErrors.includes('Model Kendaraan') && <p className="text-red-500 text-xs mt-1">Wajib diisi</p>}
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }} id="input-ukuran">
                      <label className="font-mono-ui text-sm text-secondary">Ukuran Kendaraan</label>
                      <Select
                        options={[
                          { value: 'Small', label: 'Small' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'Large', label: 'Large' },
                          { value: 'Extra Large / Supercar', label: 'Extra Large / Supercar' }
                        ]}
                        value={formData.carSize ? { value: formData.carSize, label: formData.carSize } : null}
                        onChange={(opt) => setFormData(prev => ({ ...prev, carSize: opt ? opt.value : '' }))}
                        placeholder="-- Pilih Ukuran Kendaraan --"
                        styles={{
                          ...customSelectStyles,
                          control: (base, state) => ({
                            ...customSelectStyles.control(base, state),
                            ...(formErrors.includes('Ukuran Kendaraan') && {
                              borderColor: '#ef4444',
                              backgroundColor: '#fef2f2',
                              borderWidth: '2px',
                            })
                          })
                        }}
                        isClearable={true}
                      />
                      {formErrors.includes('Ukuran Kendaraan') && <p className="text-red-500 text-xs mt-1">Wajib diisi</p>}
                    </div>
                  </div>

                  {/* Grid & Cart UI */}
                  <div className="pos-grid-container mt-6">
                    {/* Product Selection */}
                    <div className="pos-products-section">
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

                  <div className="flex justify-end mt-6">
                    <button type="button" className="btn-primary" onClick={nextStep}>Selanjutnya (Next) &rarr;</button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Info Kendaraan */}
            {currentStep === 2 && (
              <div className="form-section premium-card animate-fade-in">
                <div className="section-header">
                  <CarFront size={20} />
                  <h3 className="font-sans font-semibold">Step 2: Informasi Kendaraan</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Warna Kendaraan</label>
                    <input type="text" name="carColor" value={formData.carColor} onChange={handleInputChange} className={`input-field ${formErrors.includes('Warna Kendaraan') ? 'input-error' : ''}`} placeholder="Misal: Hitam Metalik" />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Nomor Polisi</label>
                    <input type="text" name="plateNumber" value={formData.plateNumber} onChange={handleInputChange} className={`input-field ${formErrors.includes('Nomor Polisi') ? 'input-error' : ''}`} placeholder="B 1234 XYZ" />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Nomor Rangka</label>
                    <input type="text" name="chassisNumber" value={formData.chassisNumber} onChange={handleInputChange} className={`input-field ${formErrors.includes('No. Rangka') ? 'input-error' : ''}`} placeholder="Wajib diisi" />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Nomor Mesin</label>
                    <input type="text" name="engineNumber" value={formData.engineNumber} onChange={handleInputChange} className={`input-field ${formErrors.includes('Nomor Mesin') ? 'input-error' : ''}`} placeholder="Wajib diisi" />
                  </div>
                </div>
                <div className="form-grid mt-4">
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Estimasi Tanggal</label>
                    <input type="date" name="installationDate" value={formData.installationDate} onChange={handleInputChange} className={`input-field ${formErrors.includes('Estimasi Tanggal') ? 'input-error' : ''}`} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Estimasi Waktu</label>
                    <input type="time" name="installationTime" value={formData.installationTime} onChange={handleInputChange} className={`input-field ${formErrors.includes('Estimasi Waktu') ? 'input-error' : ''}`} />
                  </div>
                </div>
                <div className="form-group mt-4">
                  <label className="font-mono-ui text-sm text-secondary">Keterangan</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-field" rows="3" placeholder="Catatan teknis khusus..."></textarea>
                </div>

                <div className="flex justify-between mt-6">
                  <button type="button" className="btn-secondary" onClick={prevStep}>&larr; Kembali</button>
                  <button type="button" className="btn-primary" onClick={nextStep}>Selanjutnya (Next) &rarr;</button>
                </div>
              </div>
            )}

            {/* Step 3: Customer Info */}
            {currentStep === 3 && (
              <div className="form-section premium-card animate-fade-in">
                <div className="section-header">
                  <User size={20} />
                  <h3 className="font-sans font-semibold">Step 3: Customer Info</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group" id="input-customerName">
                    <label className="font-mono-ui text-sm text-secondary">Nama Lengkap</label>
                    <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className={`input-field ${formErrors.includes('Nama Lengkap') ? 'input-error' : ''}`} />
                  </div>
                  <div className="form-group" id="input-customerHp">
                    <label className="font-mono-ui text-sm text-secondary">Nomor Telepon</label>
                    <input type="tel" name="customerHp" value={formData.customerHp} onChange={handleInputChange} className={`input-field ${formErrors.includes('Nomor Telepon') ? 'input-error' : ''}`} />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Email</label>
                    <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }} id="input-customerAddress">
                    <label className="font-mono-ui text-sm text-secondary">Alamat Lengkap</label>
                    <textarea name="customerAddress" value={formData.customerAddress} onChange={handleInputChange} className={`input-field ${formErrors.includes('Alamat Lengkap') ? 'input-error' : ''}`} rows="2"></textarea>
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Kota</label>
                    <input type="text" name="customerCity" value={formData.customerCity} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Provinsi</label>
                    <input type="text" name="customerProvince" value={formData.customerProvince} onChange={handleInputChange} className="input-field" />
                  </div>
                  <div className="form-group">
                    <label className="font-mono-ui text-sm text-secondary">Kode Pos</label>
                    <input type="text" name="customerZip" value={formData.customerZip} onChange={handleInputChange} className="input-field" />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button type="button" className="btn-secondary" onClick={prevStep}>&larr; Kembali</button>
                </div>
              </div>
            )}

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
                    if (item.isVariablePrice) {
                      const multiplier = formData.carSize === 'Small' ? 1 : formData.carSize === 'Medium' ? 1.2 : formData.carSize === 'Large' ? 1.5 : (formData.carSize === 'Extra Large / Supercar' || formData.carSize === 'XL/Luxury') ? 1.8 : 1;
                      itemPrice = item.price * multiplier;
                    }
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
              <button type="submit" className="btn-primary w-full mt-6" disabled={!(searchStatus === 'Data Pelanggan Ditemukan & Berhasil Diisi Otomatis!' || currentStep === 3)} style={{ marginBottom: '0.5rem' }}>
                Lanjut ke Pembayaran
              </button>
              {!(searchStatus === 'Data Pelanggan Ditemukan & Berhasil Diisi Otomatis!' || currentStep === 3) && (
                <p className="text-xs text-secondary text-center px-2 pt-2" style={{ lineHeight: '1.5' }}>Selesaikan semua langkah (Step 1-3) untuk mengaktifkan tombol ini.</p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3rem 1rem', overflowY: 'auto' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Sales</label>
                  <select
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                    value={paymentState.spgName}
                    onChange={e => setPaymentState(prev => ({ ...prev, spgName: e.target.value }))}
                  >
                    <option value="">-- Pilih Nama Sales --</option>
                    {salesItems && salesItems.map((sales) => (
                      <option key={sales.id} value={sales.nama}>{sales.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Kategori Penjualan</label>
                  <select 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                    value={paymentState.billType} 
                    onChange={e => setPaymentState(prev => ({ ...prev, billType: e.target.value }))}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Diskon Nominal (Rp)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#fff', color: '#111827', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                    placeholder="0" 
                    value={discount === 0 ? '' : discount} 
                    onChange={e => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ringkasan Finansial</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#4b5563' }}>Sub Total</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{formatCurrency(totalPrice)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#4b5563' }}>Diskon</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444' }}>- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="pajak" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" id="pajak" checked={paymentState.useTax} onChange={e => setPaymentState(prev => ({ ...prev, useTax: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151', userSelect: 'none' }}>Tambahkan Faktur Pajak (PPN 11%)</span>
                    </label>
                    {paymentState.useTax && (
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444' }}>+ {formatCurrency(taxAmount)}</span>
                    )}
                  </div>
                  
                  <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Net Total Tagihan</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{formatCurrency(netTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Telah Dibayar</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(modalPaidAmount)}</span>
                  </div>
                  
                  <div style={{ height: '2px', borderBottom: '2px dashed #e5e7eb', margin: '12px 0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>Sisa Tagihan</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>{formatCurrency(modalRemainingAmount)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>Tipe Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {['Lunas', 'DP 50%', 'DP Custom', 'Tanpa DP'].map(type => {
                    const isActive = paymentState.type === type;
                    return (
                      <div 
                        key={type}
                        onClick={() => {
                          if (type === 'Lunas') setPaymentState(prev => ({ ...prev, type, dpAmount: netTotal }));
                          else if (type === 'DP 50%') setPaymentState(prev => ({ ...prev, type, dpAmount: netTotal / 2 }));
                          else setPaymentState(prev => ({ ...prev, type, dpAmount: 0 }));
                        }}
                        style={{ 
                          padding: '16px', 
                          borderRadius: '12px', 
                          border: isActive ? '2px solid #4f46e5' : '1px solid #d1d5db', 
                          backgroundColor: isActive ? '#4f46e5' : '#ffffff',
                          color: isActive ? '#ffffff' : '#374151',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          boxShadow: isActive ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none'
                        }}
                        onMouseOver={e => { if(!isActive) { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.backgroundColor = '#f9fafb'; } }}
                        onMouseOut={e => { if(!isActive) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
                      >
                        {type}
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
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => setPaymentState(prev => ({ ...prev, method: m.id }))}
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
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => { if(!isActive) { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.backgroundColor = '#f8fafc'; } }}
                        onMouseOut={e => { if(!isActive) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = '#ffffff'; } }}
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
                onClick={() => setShowPaymentModal(false)}
                style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#4b5563', backgroundColor: '#ffffff', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                style={{ padding: '12px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: '#4f46e5', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#4338ca'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#4f46e5'}
              >
                <CheckCircle size={18} /> Konfirmasi Pembayaran
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
              {selectedProductForModal.category === 'Kaca Film' && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>1. Posisi Pemasangan</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {posisiPemasangan.map(val => (
                        <div key={val.id} onClick={() => setModalVariantState(prev => ({ ...prev, posisi: val.name }))}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: modalVariantState.posisi === val.name ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: modalVariantState.posisi === val.name ? '#eef2ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <span style={{ fontWeight: 'bold', color: modalVariantState.posisi === val.name ? '#3730a3' : '#111', fontSize: '15px' }}>{val.name}</span>
                          {modalVariantState.posisi === val.name ? <CheckCircle size={20} color="#6366f1" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #d1d5db' }}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>2. Posisi Pemasangan (Partial)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {posisiPartial.map(val => (
                        <div key={val.id} onClick={() => setModalVariantState(prev => ({ ...prev, posisi: val.name }))}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: modalVariantState.posisi === val.name ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: modalVariantState.posisi === val.name ? '#eef2ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <span style={{ fontWeight: 'bold', color: modalVariantState.posisi === val.name ? '#3730a3' : '#111', fontSize: '15px' }}>{val.name}</span>
                          {modalVariantState.posisi === val.name ? <CheckCircle size={20} color="#6366f1" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #d1d5db' }}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(selectedProductForModal.category === 'PPF' || selectedProductForModal.category === 'Coating & Chemical') && (
                <div style={{ marginBottom: '24px' }}>
                  <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Peruntukan / Bagian</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {peruntukanItems.filter(p => p.kategori === selectedProductForModal.type).map(val => (
                      <div key={val.id} onClick={() => setModalVariantState(prev => ({ ...prev, peruntukan: val.nama }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: modalVariantState.peruntukan === val.nama ? '2px solid #6366f1' : '1px solid #e5e7eb', backgroundColor: modalVariantState.peruntukan === val.nama ? '#eef2ff' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <span style={{ fontWeight: 'bold', color: modalVariantState.peruntukan === val.nama ? '#3730a3' : '#111', fontSize: '15px' }}>{val.nama}</span>
                        {modalVariantState.peruntukan === val.nama ? <CheckCircle size={20} color="#6366f1" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #d1d5db' }}></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <label className="font-sans text-sm font-bold mb-3 block" style={{ color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Catatan Produk (Opsional)</label>
                <textarea
                  placeholder="Contoh: Harap hati-hati pada bagian spion kiri..."
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
export default POS;
