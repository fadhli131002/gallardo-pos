// Mock Data for Pricing Matrix based on prd.md Point 3.1
export const PRICING_MATRIX = {
  'Kaca Film': {
    'Performante - Iron Black': {
      Small: { Depan: 225000, SKKB: 412500, Full: 562500 },
      Medium: { Depan: 265000, SKKB: 487500, Full: 675000 },
      Large: { Depan: 300000, SKKB: 600000, Full: 825000 },
      'XL/Luxury': { Depan: 337500, SKKB: 675000, Full: 937500 },
    },
    'Performante - Black Stone': {
      Small: { Depan: 675000, SKKB: 825000, Full: 1425000 },
      Medium: { Depan: 750000, SKKB: 900000, Full: 1575000 },
      Large: { Depan: 862500, SKKB: 1012500, Full: 1725000 },
      'XL/Luxury': { Depan: 975000, SKKB: 1125000, Full: 1875000 },
    },
    'Deluxe - Classic': {
      Small: { Depan: 750000, SKKB: 1162500, Full: 1762500 },
      Medium: { Depan: 787500, SKKB: 1312500, Full: 1912500 },
      Large: { Depan: 862500, SKKB: 1425000, Full: 2062500 },
      'XL/Luxury': { Depan: 937500, SKKB: 1537500, Full: 2287500 },
    },
    'Deluxe - Jet Black': {
      Small: { Depan: 975000, SKKB: 1350000, Full: 2175000 },
      Medium: { Depan: 1125000, SKKB: 1425000, Full: 2437500 },
      Large: { Depan: 1200000, SKKB: 1575000, Full: 2625000 },
      'XL/Luxury': { Depan: 1275000, SKKB: 1725000, Full: 2850000 },
    },
  },
  PPF: {
    Ultra: {
      Small: 15180000, Medium: 16096000, Large: 18584000, 'XL/Luxury': 22400000
    },
    Matte: {
      Small: 15956000, Medium: 16991000, Large: 20250000, 'XL/Luxury': 24375000
    },
    Armor: {
      Small: 21332500, Medium: 23590000, Large: 24311000, 'XL/Luxury': 29190000
    },
    'Super Safe': {
      Small: 26780000, Medium: 28340000, Large: 30485000, 'XL/Luxury': 36595000
    },
  },
  Coating: {
    'Nano Ceramic 9H+': {
      Small: 1625000, Medium: 1950000, Large: 2275000, 'XL/Luxury': 2600000
    },
    'Nano Ceramic 14H': {
      Small: 2275000, Medium: 2600000, Large: 2925000, 'XL/Luxury': 3250000
    },
    'Nano Ceramic 20H': {
      Small: 2925000, Medium: 3250000, Large: 3575000, 'XL/Luxury': 3900000
    }
  }
};

export const PRODUCT_CATALOG = [
  // Jasa & Maintenance (Layanan Non-Fisik)
  { id: 'SRV-01', name: 'Maintenance Coating', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-02', name: 'Maintenance PPF', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-03', name: 'Xterior Detailing', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-04', name: 'Interior Detailing', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-05', name: 'Engine Detailing', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-06', name: 'Poles Kaca (Water Spot)', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 },
  { id: 'SRV-07', name: 'Jasa Pelepasan PPF', category: 'Jasa & Maintenance', type: 'Jasa', isVariablePrice: false, price: 0, stock: 0, trackInventory: false, warrantyMonths: 0 }
];

const getFloatingDate = (offsetDays, hours, minutes) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const BASE_ORDERS = [
  {
    id: 'ORD-1001',
    customerName: 'Bapak Rudi',
    customerHp: '081234567801',
    carBrand: 'Toyota',
    carModel: 'Alphard',
    plateNumber: 'B 101 AAA',
    chassisNumber: 'MH1234567890001',
    service: 'Kaca Film (Deluxe - Jet Black)',
    serviceType: 'Kaca Film',
    filmBrand: 'Deluxe - Jet Black',
    filmVariation: 'Full',
    filmDarkness: 'Jet Black 80',
    totalPrice: 2175000,
    spgName: 'Andi Wijaya',
    billType: 'Digital Ads (Sosmed)',
    location: 'Gallardo',
    status: 'Selesai',
    date: getFloatingDate(-1, 9, 15),
  },
  {
    id: 'ORD-1002',
    customerName: 'Ibu Siska',
    customerHp: '081234567802',
    carBrand: 'Honda',
    carModel: 'Civic',
    plateNumber: 'B 202 BBB',
    chassisNumber: 'MH1234567890002',
    service: 'Kaca Film (Performante - Iron Black)',
    serviceType: 'Kaca Film',
    filmBrand: 'Performante - Iron Black',
    filmVariation: 'Full',
    filmDarkness: 'Iron Black 35',
    totalPrice: 562500,
    spgName: 'Budi Santoso',
    billType: 'Walk-In (Workshop)',
    location: 'Gallardo',
    status: 'Aktif',
    date: getFloatingDate(1, 10, 30),
  },
  {
    id: 'ORD-1003',
    customerName: 'Bapak Tono',
    customerHp: '081234567803',
    carBrand: 'BMW',
    carModel: 'M3',
    plateNumber: 'B 303 CCC',
    chassisNumber: 'MH1234567890003',
    service: 'Coating (Nano Ceramic 14H)',
    serviceType: 'Coating',
    coatingSeries: 'Nano Ceramic 14H',
    totalPrice: 2600000,
    spgName: 'Citra Lestari',
    billType: 'Event / Pameran',
    location: 'Gallardo',
    status: 'Selesai',
    date: getFloatingDate(-2, 13, 0),
  },
  {
    id: 'ORD-1004',
    customerName: 'Ibu Dina',
    customerHp: '081234567804',
    carBrand: 'Mercedes Benz',
    carModel: 'C-Class',
    plateNumber: 'B 404 DDD',
    chassisNumber: 'MH1234567890004',
    service: 'Coating (Nano Ceramic 20H)',
    serviceType: 'Coating',
    coatingSeries: 'Nano Ceramic 20H',
    totalPrice: 3250000,
    spgName: 'Dewi Lestari',
    billType: 'Digital Ads (Sosmed)',
    location: 'Gallardo',
    status: 'Selesai',
    date: getFloatingDate(-3, 14, 45),
  },
  {
    id: 'ORD-1005',
    customerName: 'Bapak Vano',
    customerHp: '081234567805',
    carBrand: 'Porsche',
    carModel: 'Macan',
    plateNumber: 'B 505 EEE',
    chassisNumber: 'MH1234567890005',
    service: 'PPF (Ultra)',
    serviceType: 'PPF',
    ppfSeries: 'Ultra',
    totalPrice: 15180000,
    spgName: 'Andi Wijaya',
    billType: 'Reseller (Pembelian Roll)',
    location: 'Gallardo',
    status: 'Selesai',
    date: getFloatingDate(-4, 9, 30),
  },
  {
    id: 'ORD-1006',
    customerName: 'Bapak Wira',
    customerHp: '081234567806',
    carBrand: 'Toyota',
    carModel: 'Land Cruiser',
    plateNumber: 'B 606 FFF',
    chassisNumber: 'MH1234567890006',
    service: 'PPF (Super Safe)',
    serviceType: 'PPF',
    ppfSeries: 'Super Safe',
    totalPrice: 26780000,
    spgName: 'Budi Santoso',
    billType: 'Walk-In (Workshop)',
    location: 'New Ratu',
    status: 'Aktif',
    dpAmount: 5000000,
    date: getFloatingDate(0, 11, 15),
  },
  {
    id: 'ORD-1007',
    customerName: 'Ibu Xena',
    customerHp: '081234567807',
    carBrand: 'Hyundai',
    carModel: 'Ioniq 5',
    plateNumber: 'B 707 GGG',
    chassisNumber: 'MH1234567890007',
    service: 'Kaca Film (Deluxe - Jet Black)',
    serviceType: 'Kaca Film',
    filmBrand: 'Deluxe - Jet Black',
    filmVariation: 'Full',
    filmDarkness: 'Jet Black 80',
    totalPrice: 2175000,
    spgName: 'Citra Lestari',
    billType: 'Digital Ads (Sosmed)',
    location: 'New Ratu',
    status: 'Selesai',
    date: getFloatingDate(-5, 10, 0),
  },
  {
    id: 'ORD-1008',
    customerName: 'Bapak Yayan',
    customerHp: '081234567808',
    carBrand: 'Honda',
    carModel: 'HR-V',
    plateNumber: 'B 808 HHH',
    chassisNumber: 'MH1234567890008',
    service: 'Coating (Nano Ceramic 14H)',
    serviceType: 'Coating',
    coatingSeries: 'Nano Ceramic 14H',
    totalPrice: 2600000,
    spgName: 'Andi Wijaya',
    billType: 'Event / Pameran',
    location: 'New Ratu',
    status: 'Selesai',
    date: getFloatingDate(-2, 15, 30),
  },
  {
    id: 'ORD-1009',
    customerName: 'Bapak Zaki',
    customerHp: '081234567809',
    carBrand: 'Toyota',
    carModel: 'Innova Zenix',
    plateNumber: 'B 909 III',
    chassisNumber: 'MH1234567890009',
    service: 'Kaca Film (Performante - Iron Black)',
    serviceType: 'Kaca Film',
    filmBrand: 'Performante - Iron Black',
    filmVariation: 'Full',
    filmDarkness: 'Iron Black 35',
    totalPrice: 562500,
    spgName: 'Dewi Lestari',
    billType: 'Walk-In (Workshop)',
    location: 'New Ratu',
    status: 'Aktif',
    dpAmount: 200000,
    date: getFloatingDate(0, 8, 45),
  },
  {
    id: 'ORD-1010',
    customerName: 'Bapak Arif',
    customerHp: '081234567810',
    carBrand: 'Honda',
    carModel: 'CR-V',
    plateNumber: 'B 1010 JJJ',
    chassisNumber: 'MH12345678900010',
    service: 'PPF (Ultra)',
    serviceType: 'PPF',
    ppfSeries: 'Ultra',
    totalPrice: 15180000,
    spgName: 'Andi Wijaya',
    billType: 'Digital Ads (Sosmed)',
    location: 'Gallardo',
    status: 'Selesai',
    date: getFloatingDate(-1, 16, 20),
  },
  {
    id: 'ORD-1011',
    customerName: 'Bapak Joni',
    customerHp: '081234567901',
    carBrand: 'Hyundai',
    carModel: 'Santa Fe',
    plateNumber: 'B 111 KKK',
    chassisNumber: 'MH12345678900011',
    service: 'Kaca Film (Deluxe - Jet Black)',
    serviceType: 'Kaca Film',
    filmBrand: 'Deluxe - Jet Black',
    filmVariation: 'Full',
    filmDarkness: 'Jet Black 80',
    totalPrice: 2625000,
    spgName: 'Rina Sales',
    billType: 'Walk-In (Workshop)',
    location: 'New Ratu',
    status: 'Aktif',
    date: getFloatingDate(0, 10, 0),
  },
  {
    id: 'ORD-1012',
    customerName: 'Ibu Ratih',
    customerHp: '081234567902',
    carBrand: 'Toyota',
    carModel: 'Fortuner',
    plateNumber: 'B 222 LLL',
    chassisNumber: 'MH12345678900012',
    service: 'Coating (Nano Ceramic 9H+)',
    serviceType: 'Coating',
    coatingSeries: 'Nano Ceramic 9H+',
    totalPrice: 2275000,
    spgName: 'Rina Sales',
    billType: 'Event / Pameran',
    location: 'New Ratu',
    status: 'Selesai',
    date: getFloatingDate(-1, 14, 0),
  }
];

const generateHighVolumeOrders = () => {
  const generated = [];
  const startId = 2000;
  const services = ['Kaca Film', 'Coating', 'PPF'];
  const filmBrands = ['Performante - Iron Black', 'Deluxe - Jet Black'];
  const coatingBrands = ['Nano Ceramic 9H+', 'Nano Ceramic 14H'];
  const ppfBrands = ['Ultra', 'Matte'];
  const names = ['Andi', 'Budi', 'Citra', 'Dina', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kiki', 'Lina', 'Mira', 'Nino', 'Oki'];
  const cars = [
    { brand: 'Toyota', model: 'Innova Zenix' }, { brand: 'Honda', model: 'HR-V' }, 
    { brand: 'BMW', model: 'X1' }, { brand: 'Mercedes Benz', model: 'C-Class' },
    { brand: 'Porsche', model: 'Macan' }, { brand: 'Hyundai', model: 'Ioniq 5' }
  ];

  const addresses = ['Jl. Sudirman No. 10', 'Jl. Thamrin No. 20', 'Kebayoran Baru', 'Pondok Indah', 'Kelapa Gading', 'Pantai Indah Kapuk', 'BSD City', 'Alam Sutera'];
  const colors = ['Hitam', 'Putih', 'Silver', 'Abu-abu', 'Merah', 'Biru'];
  const years = ['2020', '2021', '2022', '2023', '2024'];

  for (let i = 0; i < 18; i++) {
    const sType = services[i % 3];
    const car = cars[i % cars.length];
    
    let serviceStr = '';
    if (sType === 'Kaca Film') serviceStr = `Kaca Film (${filmBrands[i % 2]})`;
    else if (sType === 'Coating') serviceStr = `Coating (${coatingBrands[i % 2]})`;
    else serviceStr = `PPF (${ppfBrands[i % 2]})`;

    generated.push({
      id: `ORD-${startId + i}`,
      customerName: `Customer ${names[i % names.length]}`,
      customerHp: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
      customerAddress: addresses[i % addresses.length],
      carBrand: car.brand,
      carModel: car.model,
      carColor: colors[i % colors.length],
      carYear: years[i % years.length],
      carSize: car.brand === 'Toyota' && car.model.includes('Innova') ? 'Large' : 'Medium',
      plateNumber: `B ${100 + i} XYZ`,
      engineNumber: `ENG${Math.floor(100000 + Math.random() * 900000)}`,
      chassisNumber: 'MH12345678900013',
      service: serviceStr,
      serviceType: sType,
      filmBrand: sType === 'Kaca Film' ? filmBrands[i % 2] : undefined,
      coatingSeries: sType === 'Coating' ? coatingBrands[i % 2] : undefined,
      ppfSeries: sType === 'PPF' ? ppfBrands[i % 2] : undefined,
      totalPrice: 2500000 + (Math.random() * 5000000),
      spgName: i % 2 === 0 ? 'Andi Wijaya' : 'Budi Santoso',
      billType: 'Walk-In (Workshop)',
      location: i % 2 === 0 ? 'Gallardo' : 'New Ratu',
      status: i % 3 === 0 ? 'Aktif' : 'Selesai',
      date: getFloatingDate(0, 9 + (i % 8), Math.floor(Math.random() * 60)),
    });
  }
  return generated;
};

export const INITIAL_ORDERS = [
  ...BASE_ORDERS.map(o => ({
    ...o,
    customerAddress: o.customerAddress || 'Jakarta (Default)',
    carColor: o.carColor || 'Hitam',
    carYear: o.carYear || '2023',
    carSize: o.carSize || 'Medium',
    engineNumber: o.engineNumber || 'ENG123456'
  })), 
  ...generateHighVolumeOrders()
];

// Helper to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Reference data for Car Brands and Models
export const CAR_BRANDS = {
  // Jepang
  Honda: [
    { model: 'CR-V', size: 'Large' }, { model: 'HR-V', size: 'Medium' }, { model: 'BR-V', size: 'Medium' }, { model: 'WR-V', size: 'Small' },
    { model: 'Civic', size: 'Medium' }, { model: 'City', size: 'Small' }, { model: 'Accord', size: 'Large' }, { model: 'Jazz/Fit', size: 'Small' },
    { model: 'Odyssey', size: 'Large' }, { model: 'Pilot', size: 'Large' }, { model: 'Passport', size: 'Large' }, { model: 'Ridgeline', size: 'Large' }
  ],
  Toyota: [
    { model: 'Corolla', size: 'Medium' }, { model: 'Camry', size: 'Large' }, { model: 'Yaris', size: 'Small' }, { model: 'Vios', size: 'Small' },
    { model: 'Raize', size: 'Small' }, { model: 'Rush', size: 'Medium' }, { model: 'Fortuner', size: 'Large' }, { model: 'Hilux', size: 'Large' },
    { model: 'Innova', size: 'Large' }, { model: 'Land Cruiser', size: 'XL/Luxury' }, { model: 'Prado', size: 'Large' }, { model: 'RAV4', size: 'Medium' },
    { model: 'Corolla Cross', size: 'Medium' }, { model: 'Prius', size: 'Medium' }, { model: 'bZ4X', size: 'Medium' }, { model: 'Alphard', size: 'XL/Luxury' },
    { model: 'Vellfire', size: 'XL/Luxury' }, { model: 'Avanza / Veloz', size: 'Medium' }, { model: 'Agya / Calya', size: 'Small' }
  ],
  Lexus: [
    { model: 'RX', size: 'Large' }, { model: 'NX', size: 'Medium' }, { model: 'LX', size: 'XL/Luxury' }, { model: 'GX', size: 'Large' },
    { model: 'ES', size: 'Large' }, { model: 'LS', size: 'XL/Luxury' }, { model: 'IS', size: 'Medium' }, { model: 'UX', size: 'Small' },
    { model: 'LM', size: 'XL/Luxury' }, { model: 'RZ', size: 'Medium' }
  ],
  Nissan: [
    { model: 'X-Trail', size: 'Medium' }, { model: 'Kicks', size: 'Small' }, { model: 'Patrol', size: 'XL/Luxury' }, { model: 'Navara', size: 'Large' },
    { model: 'Almera', size: 'Small' }, { model: 'Sentra', size: 'Medium' }, { model: 'Versa', size: 'Small' }, { model: 'Z', size: 'Medium' },
    { model: 'GT-R', size: 'Medium' }, { model: 'Ariya', size: 'Medium' }
  ],
  Mazda: [
    { model: 'Mazda2', size: 'Small' }, { model: 'Mazda3', size: 'Medium' }, { model: 'Mazda6', size: 'Large' }, { model: 'CX-3', size: 'Small' },
    { model: 'CX-30', size: 'Medium' }, { model: 'CX-5', size: 'Medium' }, { model: 'CX-60', size: 'Large' }, { model: 'CX-70', size: 'Large' },
    { model: 'CX-80', size: 'Large' }, { model: 'CX-90', size: 'XL/Luxury' }, { model: 'MX-5', size: 'Small' }
  ],
  Suzuki: [
    { model: 'Jimny', size: 'Small' }, { model: 'Swift', size: 'Small' }, { model: 'Baleno', size: 'Small' }, { model: 'Ertiga', size: 'Medium' },
    { model: 'XL7', size: 'Medium' }, { model: 'Fronx', size: 'Small' }, { model: 'Grand Vitara', size: 'Medium' }, { model: 'S-Cross', size: 'Medium' },
    { model: 'Ignis', size: 'Small' }
  ],
  Mitsubishi: [
    { model: 'Xpander', size: 'Medium' }, { model: 'Xforce', size: 'Medium' }, { model: 'Pajero Sport', size: 'Large' }, { model: 'Triton', size: 'Large' },
    { model: 'Outlander', size: 'Medium' }, { model: 'Eclipse Cross', size: 'Medium' }, { model: 'ASX', size: 'Medium' }, { model: 'L200', size: 'Large' }
  ],
  Subaru: [
    { model: 'Forester', size: 'Medium' }, { model: 'Outback', size: 'Large' }, { model: 'Crosstrek (XV)', size: 'Medium' }, { model: 'WRX', size: 'Medium' },
    { model: 'BRZ', size: 'Small' }, { model: 'Legacy', size: 'Medium' }, { model: 'Solterra', size: 'Medium' }
  ],
  Isuzu: [
    { model: 'D-Max', size: 'Large' }, { model: 'MU-X', size: 'Large' }
  ],
  Daihatsu: [
    { model: 'Rocky', size: 'Small' }, { model: 'Terios', size: 'Medium' }, { model: 'Gran Max', size: 'Medium' }, { model: 'Sigra', size: 'Small' },
    { model: 'Ayla', size: 'Small' }, { model: 'Taft', size: 'Small' }
  ],

  // Korea Selatan
  Hyundai: [
    { model: 'Creta', size: 'Small' }, { model: 'Kona', size: 'Small' }, { model: 'Tucson', size: 'Medium' }, { model: 'Santa Fe', size: 'Large' },
    { model: 'Palisade', size: 'XL/Luxury' }, { model: 'Stargazer', size: 'Medium' }, { model: 'Ioniq 5', size: 'Medium' }, { model: 'Ioniq 6', size: 'Medium' },
    { model: 'Casper', size: 'Small' }, { model: 'Elantra', size: 'Medium' }
  ],
  Kia: [
    { model: 'Sonet', size: 'Small' }, { model: 'Seltos', size: 'Small' }, { model: 'Sportage', size: 'Medium' }, { model: 'Sorento', size: 'Large' },
    { model: 'Carnival', size: 'XL/Luxury' }, { model: 'EV3', size: 'Small' }, { model: 'EV5', size: 'Medium' }, { model: 'EV6', size: 'Medium' },
    { model: 'EV9', size: 'XL/Luxury' }, { model: 'Picanto', size: 'Small' }, { model: 'K5', size: 'Medium' }
  ],
  Genesis: [
    { model: 'G70', size: 'Medium' }, { model: 'G80', size: 'Large' }, { model: 'G90', size: 'XL/Luxury' }, { model: 'GV60', size: 'Medium' },
    { model: 'GV70', size: 'Medium' }, { model: 'GV80', size: 'Large' }
  ],

  // Jerman
  'Mercedes-Benz': [
    { model: 'A-Class', size: 'Small' }, { model: 'C-Class', size: 'Medium' }, { model: 'E-Class', size: 'Large' }, { model: 'S-Class', size: 'XL/Luxury' },
    { model: 'CLA', size: 'Medium' }, { model: 'GLA', size: 'Small' }, { model: 'GLB', size: 'Medium' }, { model: 'GLC', size: 'Medium' },
    { model: 'GLE', size: 'Large' }, { model: 'GLS', size: 'XL/Luxury' }, { model: 'G-Class', size: 'XL/Luxury' }, { model: 'EQA', size: 'Small' },
    { model: 'EQB', size: 'Medium' }, { model: 'EQE', size: 'Large' }, { model: 'EQS', size: 'XL/Luxury' }
  ],
  BMW: [
    { model: 'Seri 1', size: 'Small' }, { model: 'Seri 2', size: 'Small' }, { model: 'Seri 3', size: 'Medium' }, { model: 'Seri 4', size: 'Medium' },
    { model: 'Seri 5', size: 'Large' }, { model: 'Seri 7', size: 'XL/Luxury' }, { model: 'X1', size: 'Small' }, { model: 'X3', size: 'Medium' },
    { model: 'X5', size: 'Large' }, { model: 'X7', size: 'XL/Luxury' }, { model: 'XM', size: 'XL/Luxury' }, { model: 'i4', size: 'Medium' },
    { model: 'i5', size: 'Large' }, { model: 'i7', size: 'XL/Luxury' }, { model: 'iX', size: 'Large' }
  ],
  Audi: [
    { model: 'A3', size: 'Small' }, { model: 'A4', size: 'Medium' }, { model: 'A5', size: 'Medium' }, { model: 'A6', size: 'Large' },
    { model: 'A8', size: 'XL/Luxury' }, { model: 'Q2', size: 'Small' }, { model: 'Q3', size: 'Small' }, { model: 'Q5', size: 'Medium' },
    { model: 'Q7', size: 'Large' }, { model: 'Q8', size: 'Large' }, { model: 'e-tron', size: 'Large' }, { model: 'Q4 e-tron', size: 'Medium' },
    { model: 'Q6 e-tron', size: 'Large' }
  ],
  Volkswagen: [
    { model: 'Polo', size: 'Small' }, { model: 'Golf', size: 'Small' }, { model: 'Passat', size: 'Medium' }, { model: 'Tiguan', size: 'Medium' },
    { model: 'Touareg', size: 'Large' }, { model: 'T-Cross', size: 'Small' }, { model: 'Taos', size: 'Medium' }, { model: 'ID.3', size: 'Small' },
    { model: 'ID.4', size: 'Medium' }, { model: 'ID. Buzz', size: 'Large' }
  ],
  Porsche: [
    { model: '911', size: 'Medium' }, { model: 'Cayman', size: 'Small' }, { model: 'Boxster', size: 'Small' }, { model: 'Macan', size: 'Medium' },
    { model: 'Cayenne', size: 'Large' }, { model: 'Panamera', size: 'Large' }, { model: 'Taycan', size: 'Large' }
  ],
  Opel: [
    { model: 'Corsa', size: 'Small' }, { model: 'Astra', size: 'Medium' }, { model: 'Mokka', size: 'Small' }, { model: 'Grandland', size: 'Medium' }
  ],
  Smart: [
    { model: '#1', size: 'Small' }, { model: '#3', size: 'Small' }, { model: '#5', size: 'Medium' }
  ],

  // Amerika Serikat & Inggris
  Ford: [
    { model: 'Ranger', size: 'Large' }, { model: 'Everest', size: 'Large' }, { model: 'F-150', size: 'XL/Luxury' }, { model: 'Mustang', size: 'Medium' },
    { model: 'Explorer', size: 'Large' }, { model: 'Escape', size: 'Medium' }, { model: 'Bronco', size: 'Large' }, { model: 'Bronco Sport', size: 'Medium' },
    { model: 'Maverick', size: 'Large' }, { model: 'Expedition', size: 'XL/Luxury' }, { model: 'Mach-E', size: 'Medium' }
  ],
  Chevrolet: [
    { model: 'Silverado', size: 'XL/Luxury' }, { model: 'Colorado', size: 'Large' }, { model: 'Tahoe', size: 'XL/Luxury' }, { model: 'Suburban', size: 'XL/Luxury' },
    { model: 'Traverse', size: 'Large' }, { model: 'Trailblazer', size: 'Small' }, { model: 'Equinox', size: 'Medium' }, { model: 'Blazer', size: 'Medium' },
    { model: 'Corvette', size: 'Medium' }
  ],
  Jeep: [
    { model: 'Wrangler', size: 'Medium' }, { model: 'Gladiator', size: 'Large' }, { model: 'Compass', size: 'Small' }, { model: 'Cherokee', size: 'Medium' },
    { model: 'Grand Cherokee', size: 'Large' }, { model: 'Renegade', size: 'Small' }, { model: 'Wagoneer', size: 'XL/Luxury' }
  ],
  Tesla: [
    { model: 'Model S', size: 'Large' }, { model: 'Model 3', size: 'Medium' }, { model: 'Model X', size: 'Large' }, { model: 'Model Y', size: 'Medium' },
    { model: 'Cybertruck', size: 'XL/Luxury' }
  ],
  'Land Rover': [
    { model: 'Defender', size: 'Large' }, { model: 'Discovery', size: 'Large' }, { model: 'Discovery Sport', size: 'Medium' },
    { model: 'Range Rover', size: 'XL/Luxury' }, { model: 'Range Rover Sport', size: 'Large' }, { model: 'Range Rover Velar', size: 'Medium' },
    { model: 'Range Rover Evoque', size: 'Small' }
  ],
  Mini: [
    { model: 'Cooper', size: 'Small' }, { model: 'Countryman', size: 'Medium' }, { model: 'Aceman', size: 'Small' }
  ],
  GMC: [
    { model: 'Sierra', size: 'XL/Luxury' }, { model: 'Canyon', size: 'Large' }, { model: 'Yukon', size: 'XL/Luxury' }, { model: 'Terrain', size: 'Medium' },
    { model: 'Acadia', size: 'Large' }
  ],
  Cadillac: [
    { model: 'Escalade', size: 'XL/Luxury' }, { model: 'XT4', size: 'Small' }, { model: 'XT5', size: 'Medium' }, { model: 'XT6', size: 'Large' },
    { model: 'CT4', size: 'Medium' }, { model: 'CT5', size: 'Large' }, { model: 'Lyriq', size: 'Large' }
  ],
  Dodge: [
    { model: 'Charger', size: 'Large' }, { model: 'Challenger', size: 'Large' }, { model: 'Durango', size: 'Large' }, { model: 'Hornet', size: 'Small' }
  ],
  RAM: [
    { model: '1500', size: 'XL/Luxury' }, { model: '2500', size: 'XL/Luxury' }, { model: '3500', size: 'XL/Luxury' }
  ],
  Lincoln: [
    { model: 'Navigator', size: 'XL/Luxury' }, { model: 'Aviator', size: 'Large' }, { model: 'Nautilus', size: 'Medium' }, { model: 'Corsair', size: 'Small' }
  ],
  Jaguar: [
    { model: 'F-Pace', size: 'Medium' }, { model: 'E-Pace', size: 'Small' }, { model: 'I-Pace', size: 'Medium' }, { model: 'XF', size: 'Large' },
    { model: 'F-Type', size: 'Medium' }
  ],
  Bentley: [
    { model: 'Bentayga', size: 'XL/Luxury' }, { model: 'Continental GT', size: 'XL/Luxury' }, { model: 'Flying Spur', size: 'XL/Luxury' }
  ],
  'Rolls-Royce': [
    { model: 'Phantom', size: 'XL/Luxury' }, { model: 'Ghost', size: 'XL/Luxury' }, { model: 'Cullinan', size: 'XL/Luxury' }, { model: 'Spectre', size: 'XL/Luxury' }
  ],
  'Aston Martin': [
    { model: 'DBX', size: 'Large' }, { model: 'Vantage', size: 'Medium' }, { model: 'DB12', size: 'Large' }
  ],
  McLaren: [
    { model: 'Artura', size: 'Medium' }, { model: '750S', size: 'Medium' }, { model: 'GTS', size: 'Medium' }
  ],

  // Italia, Prancis, Swedia
  Ferrari: [
    { model: 'Roma', size: 'Medium' }, { model: 'SF90 Stradale', size: 'Medium' }, { model: 'Purosangue', size: 'Large' }, { model: '296 GTB', size: 'Medium' },
    { model: '12Cilindri', size: 'Medium' }
  ],
  Lamborghini: [
    { model: 'Revuelto', size: 'Medium' }, { model: 'Temerario', size: 'Medium' }, { model: 'Urus', size: 'Large' }
  ],
  Maserati: [
    { model: 'Ghibli', size: 'Large' }, { model: 'Grecale', size: 'Medium' }, { model: 'Levante', size: 'Large' }, { model: 'GranTurismo', size: 'Large' },
    { model: 'MC20', size: 'Medium' }
  ],
  Peugeot: [
    { model: '208', size: 'Small' }, { model: '308', size: 'Medium' }, { model: '2008', size: 'Small' }, { model: '3008', size: 'Medium' },
    { model: '5008', size: 'Large' }
  ],
  Volvo: [
    { model: 'XC40', size: 'Small' }, { model: 'XC60', size: 'Medium' }, { model: 'XC90', size: 'Large' }, { model: 'EX30', size: 'Small' },
    { model: 'EX40', size: 'Small' }, { model: 'EX90', size: 'Large' }, { model: 'S60', size: 'Medium' }
  ],
  Fiat: [
    { model: '500', size: 'Small' }, { model: 'Panda', size: 'Small' }, { model: 'Tipo', size: 'Medium' }
  ],
  'Alfa Romeo': [
    { model: 'Giulia', size: 'Medium' }, { model: 'Stelvio', size: 'Medium' }, { model: 'Tonale', size: 'Small' }
  ],
  Renault: [
    { model: 'Clio', size: 'Small' }, { model: 'Captur', size: 'Small' }, { model: 'Megane', size: 'Medium' }, { model: 'Austral', size: 'Medium' }
  ],
  Citroen: [
    { model: 'C3', size: 'Small' }, { model: 'C4', size: 'Medium' }, { model: 'C5 Aircross', size: 'Medium' }
  ],
  Polestar: [
    { model: '2', size: 'Medium' }, { model: '3', size: 'Large' }, { model: '4', size: 'Medium' }
  ],

  // China & India
  BYD: [
    { model: 'Dolphin', size: 'Small' }, { model: 'Atto 3', size: 'Medium' }, { model: 'Seal', size: 'Medium' }, { model: 'Sealion 7', size: 'Medium' },
    { model: 'M6', size: 'Medium' }, { model: 'Han', size: 'Large' }, { model: 'Tang', size: 'Large' }, { model: 'Yuan Plus', size: 'Medium' }
  ],
  Chery: [
    { model: 'Tiggo 2', size: 'Small' }, { model: 'Tiggo 4', size: 'Small' }, { model: 'Tiggo 7', size: 'Medium' }, { model: 'Tiggo 8', size: 'Large' },
    { model: 'Omoda C5', size: 'Medium' }
  ],
  Wuling: [
    { model: 'Air EV', size: 'Small' }, { model: 'Binguo EV', size: 'Small' }, { model: 'Cloud EV', size: 'Medium' }, { model: 'Alvez', size: 'Small' },
    { model: 'Cortez', size: 'Medium' }, { model: 'Confero', size: 'Medium' }
  ],
  Omoda: [
    { model: 'Omoda 5', size: 'Medium' }
  ],
  Jaecoo: [
    { model: 'J7', size: 'Medium' }, { model: 'J8', size: 'Large' }
  ],
  MG: [
    { model: 'MG 4 EV', size: 'Medium' }, { model: 'ZS', size: 'Small' }, { model: 'HS', size: 'Medium' }, { model: 'MG 5', size: 'Medium' },
    { model: 'Cyberster', size: 'Medium' }
  ],
  Geely: [
    { model: 'Coolray', size: 'Small' }, { model: 'Azkarra', size: 'Medium' }, { model: 'Okavango', size: 'Large' }
  ],
  Zeekr: [
    { model: '001', size: 'Large' }, { model: 'X', size: 'Small' }, { model: '009', size: 'XL/Luxury' }
  ],
  NIO: [
    { model: 'ES8', size: 'Large' }, { model: 'ES6', size: 'Medium' }, { model: 'ET7', size: 'Large' }, { model: 'ET5', size: 'Medium' }
  ],
  XPeng: [
    { model: 'P7', size: 'Large' }, { model: 'G9', size: 'Large' }, { model: 'P5', size: 'Medium' }
  ],
  'Li Auto': [
    { model: 'L9', size: 'XL/Luxury' }, { model: 'L8', size: 'Large' }, { model: 'L7', size: 'Large' }
  ],
  AION: [
    { model: 'Y Plus', size: 'Medium' }, { model: 'V Plus', size: 'Medium' }, { model: 'Hyper HT', size: 'Large' }
  ],
  Jetour: [
    { model: 'Dashing', size: 'Medium' }, { model: 'X70', size: 'Large' }
  ],
  GWM: [
    { model: 'Haval H6', size: 'Medium' }, { model: 'Jolion', size: 'Small' }, { model: 'Tank 300', size: 'Medium' }, { model: 'Tank 500', size: 'Large' },
    { model: 'Ora Good Cat', size: 'Small' }
  ],
  BAIC: [
    { model: 'BJ40', size: 'Medium' }, { model: 'BJ80', size: 'Large' }, { model: 'X55', size: 'Medium' }
  ],
  'Tata Motors': [
    { model: 'Nexon', size: 'Small' }, { model: 'Harrier', size: 'Medium' }, { model: 'Safari', size: 'Large' }, { model: 'Tiago', size: 'Small' },
    { model: 'Punch', size: 'Small' }
  ],
  Mahindra: [
    { model: 'Thar', size: 'Small' }, { model: 'XUV700', size: 'Medium' }, { model: 'Scorpio-N', size: 'Large' }
  ]
};
