/**
 * unitConversion.js
 * Utilitas Konversi Satuan Otomatis (Dual-Unit Conversion) untuk Gudang POS-Gallardo
 *
 * Aturan Konversi:
 * 1. PPF:
 *    - 1 Roll = 1.500 CM (15 m)
 *    - 1 Meter (m) = 100 CM
 *    - Total CM = (Stok Utama Roll * 1500) + (Pecahan Meter * 100)
 *
 * 2. Kaca Film:
 *    - 1 Roll = 3.000 CM (30 m)
 *    - 1 Meter (m) = 100 CM
 *    - Total CM = (Stok Utama Roll * 3000) + (Pecahan Meter * 100)
 *
 * 3. Coating:
 *    - Standar Botol: 1 Botol = 50 ML = 3 UNIT (1 Unit mobil ≈ 16,67 ML)
 *    - Standar Liter: 1 LITER = 1.000 ML = 60 UNIT (1 Unit mobil ≈ 16,67 ML)
 *    - Total ML = (Stok Utama * Kapasitas ML) + Pecahan ML
 *    - Total UNIT = (Stok Utama * Unit per Utama) + Math.floor(Pecahan ML / 16.67)
 */

const EXACT_ML_PER_UNIT = 50 / 3; // 16.6666666667 ML per Unit

/**
 * Deteksi apakah item Coating menggunakan satuan utama LITER (1.000 ML)
 */
export const isLiterItem = (item) => {
  if (!item) return false;
  const sat = String(item.satuan || '').trim().toUpperCase();
  const varName = String(item.varian || '').trim().toUpperCase();
  const brandName = String(item.brand || '').trim().toUpperCase();
  return (
    sat === 'LITER' ||
    sat === 'LTR' ||
    sat === 'L' ||
    sat.includes('LITER') ||
    varName.includes('1 LITER') ||
    varName.includes('1LITER') ||
    brandName.includes('1 LITER')
  );
};

/**
 * Format angka ribuan dengan pemisah titik sesuai standar Indonesia (contoh: 79.500)
 */
export const formatThousand = (val, maxDecimals = 0) => {
  const num = Number(val);
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  }).format(num);
};

/**
 * Menghitung rincian konversi lengkap untuk 1 baris item inventaris
 */
export const getConversionDetails = (item) => {
  if (!item) return null;

  const kategori = item.kategori || '';
  const utama = Number(item.stokUtama ?? item.stok_utama ?? 0);
  const pecahan = Number(item.stokPecahan ?? item.stok_pecahan ?? 0);
  const satuan = item.satuan || (kategori === 'Coating' ? 'Botol' : 'Roll');

  if (kategori === 'PPF' || kategori === 'Kaca Film') {
    const cmPerRoll = kategori === 'PPF' ? 1500 : 3000;
    const mPerRoll = kategori === 'PPF' ? 15 : 30;
    const utamaCM = Math.round(utama * cmPerRoll);
    const pecahanM = parseFloat(pecahan.toFixed(2));
    const pecahanCM = Math.round(pecahan * 100);
    const totalCM = utamaCM + pecahanCM;
    const totalM = parseFloat((totalCM / 100).toFixed(2));

    return {
      isConvertible: true,
      type: 'FILM_PPF',
      kategori,
      satuan,
      cmPerRoll,
      mPerRoll,
      utama,
      pecahan: pecahanM,
      utamaCM,
      pecahanCM,
      totalCM,
      totalM,
      utamaDisplay: `${formatThousand(utama)} ${satuan}`,
      utamaConvDisplay: `${formatThousand(utamaCM)} CM`,
      pecahanDisplay: pecahanM > 0 ? `${formatThousand(pecahanM, 2)} m` : '0 m',
      pecahanConvDisplay: `${formatThousand(pecahanCM)} CM`,
      pecahanFullDisplay:
        pecahanM > 0
          ? `${formatThousand(pecahanM, 2)} m (${formatThousand(pecahanCM)} CM)`
          : `0 m (0 CM)`,
      totalKonversiDisplay: `${formatThousand(totalCM)} CM`,
      totalSecondaryDisplay: `${formatThousand(totalM, 2)} m`,
      ruleHint: `1 Roll = ${formatThousand(cmPerRoll)} CM (${mPerRoll} m)`
    };
  }

  if (kategori === 'Coating') {
    const isLiter = isLiterItem(item);
    const mlPerBotol = isLiter ? 1000 : 50;
    const unitPerBotol = isLiter ? 60 : 3;
    const mlPerUnit = 16.67;
    const unitLabel = isLiter ? (item.satuan || 'LITER') : (item.satuan || 'Botol');

    const utamaML = Math.round(utama * mlPerBotol);
    const utamaUnit = utama * unitPerBotol;
    const pecahanML = parseFloat(pecahan.toFixed(2));
    const pecahanUnit = Math.floor((pecahanML + 0.5) / EXACT_ML_PER_UNIT);
    const totalML = parseFloat((utamaML + pecahanML).toFixed(2));
    const totalUnit = utamaUnit + pecahanUnit;

    return {
      isConvertible: true,
      type: 'COATING',
      isLiter,
      kategori,
      satuan: unitLabel,
      mlPerBotol,
      unitPerBotol,
      mlPerUnit,
      utama,
      pecahan: pecahanML,
      utamaML,
      utamaUnit,
      pecahanML,
      pecahanUnit,
      totalML,
      totalUnit,
      utamaDisplay: `${formatThousand(utama)} ${unitLabel}`,
      utamaConvDisplay: `${formatThousand(utamaUnit)} UNIT (${formatThousand(utamaML)} ML)`,
      pecahanDisplay: pecahanML > 0 ? `${formatThousand(pecahanML, 2)} ml` : '0 ml',
      pecahanConvDisplay: pecahanUnit > 0 ? `${formatThousand(pecahanUnit)} UNIT` : '0 UNIT',
      pecahanFullDisplay: pecahanML > 0 ? `${formatThousand(pecahanML, 2)} ml` : '0 ml',
      totalKonversiDisplay: `${formatThousand(totalUnit)} UNIT (${formatThousand(Math.round(totalML))} ML)`,
      totalSecondaryDisplay: `${formatThousand(totalML, 2)} ML`,
      ruleHint: isLiter
        ? `1 LITER = 1.000 ML = 60 UNIT (1 Unit ≈ 16,67 ML)`
        : `1 Botol = 50 ML = 3 UNIT (1 Unit ≈ 16,67 ML)`
    };
  }

  // Kategori lainnya (Tools & Equipment, dll)
  return {
    isConvertible: false,
    type: 'STANDARD',
    kategori,
    satuan,
    utama,
    pecahan,
    utamaDisplay: `${formatThousand(utama)} ${satuan}`,
    utamaConvDisplay: `${formatThousand(utama)} ${satuan.toUpperCase()}`,
    pecahanDisplay: '-',
    pecahanConvDisplay: '-',
    pecahanFullDisplay: '-',
    totalKonversiDisplay: `${formatThousand(utama)} ${satuan.toUpperCase()}`,
    totalSecondaryDisplay: '',
    ruleHint: `Satuan standar (${satuan})`
  };
};

/**
 * Menghitung hasil penambahan ('add'), pengurangan ('deduct'), atau set nilai fisik ('set')
 * dari satuan input apapun dan memecahnya kembali ke { stokUtama, stokPecahan }.
 */
export const calculateStockMutation = (
  item,
  mode = 'add',
  inputUnit = 'ROLL',
  primaryVal = 0,
  secondaryVal = 0,
  secondaryUnit = 'M'
) => {
  const details = getConversionDetails(item);
  const pVal = Math.max(0, Number(primaryVal) || 0);
  const sVal = Math.max(0, Number(secondaryVal) || 0);

  if (!details) {
    return { stokUtama: 0, stokPecahan: 0, isValid: false };
  }

  // 1. KATEGORI PPF & KACA FILM
  if (details.type === 'FILM_PPF') {
    const { cmPerRoll } = details;
    const currentTotalCM = details.totalCM;

    let inputCM = 0;
    if (inputUnit === 'CM') {
      inputCM = Math.round(pVal);
    } else if (inputUnit === 'M') {
      inputCM = Math.round(pVal * 100);
    } else {
      const secCM = secondaryUnit === 'CM' ? Math.round(sVal) : Math.round(sVal * 100);
      inputCM = Math.round(pVal * cmPerRoll) + secCM;
    }

    let newTotalCM = currentTotalCM;
    if (mode === 'add') {
      newTotalCM = currentTotalCM + inputCM;
    } else if (mode === 'deduct') {
      newTotalCM = Math.max(0, currentTotalCM - inputCM);
    } else if (mode === 'set') {
      newTotalCM = Math.max(0, inputCM);
    }

    const newUtama = Math.floor(newTotalCM / cmPerRoll);
    const remCM = newTotalCM % cmPerRoll;
    const newPecahan = parseFloat((remCM / 100).toFixed(2));
    const deltaCM = newTotalCM - currentTotalCM;
    const deltaM = parseFloat((deltaCM / 100).toFixed(2));

    let actionSummary = '';
    const absCM = Math.abs(deltaCM);
    if (inputUnit === 'CM') {
      actionSummary = `${formatThousand(pVal)} CM`;
    } else if (inputUnit === 'M') {
      actionSummary = `${formatThousand(pVal, 2)} m (${formatThousand(inputCM)} CM)`;
    } else {
      actionSummary = `${formatThousand(pVal)} Roll${sVal > 0 ? ` + ${formatThousand(sVal, 2)} ${secondaryUnit === 'CM' ? 'CM' : 'm'}` : ''} (${formatThousand(inputCM)} CM)`;
    }

    return {
      stokUtama: newUtama,
      stokPecahan: newPecahan,
      newPecahanCM: remCM,
      currentTotalCM,
      newTotalCM,
      inputCM,
      deltaCM,
      deltaM,
      diffUtama: newUtama - details.utama,
      diffPecahan: parseFloat((newPecahan - details.pecahan).toFixed(2)),
      hasChanged: deltaCM !== 0,
      exceedsStock: mode === 'deduct' && inputCM > currentTotalCM,
      actionSummary,
      resultSummary: `${formatThousand(newUtama)} Roll${newPecahan > 0 ? ` + ${formatThousand(newPecahan, 2)} m (${formatThousand(remCM)} CM)` : ''} | Total: ${formatThousand(newTotalCM)} CM`,
      deltaSummary: `${deltaCM >= 0 ? '+' : '-'}${formatThousand(absCM)} CM`
    };
  }

  // 2. KATEGORI COATING (Mendukung Botol 50 ML & Kemasan 1 LITER = 1.000 ML)
  if (details.type === 'COATING') {
    const { mlPerBotol, unitPerBotol, mlPerUnit, satuan } = details;
    const currentTotalML = details.totalML;
    const currentTotalUnit = details.totalUnit;

    let inputML = 0;
    if (inputUnit === 'ML') {
      inputML = pVal;
    } else if (inputUnit === 'UNIT') {
      // Setiap 3 UNIT = 50 ML, sisanya * 16.67 ML
      const groupsOfThree = Math.floor(pVal / 3);
      const remUnits = pVal % 3;
      inputML = (groupsOfThree * 50) + (remUnits * mlPerUnit);
    } else {
      // 'BOTOL' / 'LITER' (bisa disertai pecahan ML)
      inputML = (pVal * mlPerBotol) + sVal;
    }

    let rawNewTotalML = currentTotalML;
    if (mode === 'add') {
      rawNewTotalML = currentTotalML + inputML;
    } else if (mode === 'deduct') {
      rawNewTotalML = Math.max(0, currentTotalML - inputML);
    } else if (mode === 'set') {
      rawNewTotalML = Math.max(0, inputML);
    }

    // Snap floating-point drift ke kelipatan 16.67 / 33.33 / 50.00 ML terdekat
    let newUtama = Math.floor((rawNewTotalML + 0.08) / mlPerBotol);
    let remML = rawNewTotalML - (newUtama * mlPerBotol);

    const nearestThird = Math.round(remML / EXACT_ML_PER_UNIT) * EXACT_ML_PER_UNIT;
    if (remML <= 0.12) {
      remML = 0;
    } else if (remML >= mlPerBotol - 0.15) {
      newUtama += 1;
      remML = 0;
    } else if (Math.abs(remML - nearestThird) <= 0.16) {
      remML = parseFloat(nearestThird.toFixed(2));
    } else {
      remML = parseFloat(remML.toFixed(2));
    }

    const newPecahan = remML;
    const newTotalML = parseFloat(((newUtama * mlPerBotol) + newPecahan).toFixed(2));
    const newTotalUnit = (newUtama * unitPerBotol) + Math.floor((newPecahan + 0.5) / EXACT_ML_PER_UNIT);
    const deltaML = parseFloat((newTotalML - currentTotalML).toFixed(2));
    const deltaUnit = newTotalUnit - currentTotalUnit;

    let actionSummary = '';
    if (inputUnit === 'UNIT') {
      actionSummary = `${formatThousand(pVal, 2)} UNIT (${formatThousand(inputML, 2)} ML)`;
    } else if (inputUnit === 'ML') {
      actionSummary = `${formatThousand(pVal, 2)} ML`;
    } else {
      actionSummary = `${formatThousand(pVal)} ${satuan}${sVal > 0 ? ` + ${formatThousand(sVal, 2)} ml` : ''} (${formatThousand(inputML, 2)} ML)`;
    }

    return {
      stokUtama: newUtama,
      stokPecahan: newPecahan,
      currentTotalML,
      newTotalML,
      currentTotalUnit,
      newTotalUnit,
      inputML: parseFloat(inputML.toFixed(2)),
      deltaML,
      deltaUnit,
      diffUtama: newUtama - details.utama,
      diffPecahan: parseFloat((newPecahan - details.pecahan).toFixed(2)),
      hasChanged: Math.abs(deltaML) > 0.01,
      exceedsStock: mode === 'deduct' && inputML > currentTotalML + 0.1,
      actionSummary,
      resultSummary: `${formatThousand(newUtama)} ${satuan}${newPecahan > 0 ? ` + ${formatThousand(newPecahan, 2)} ml` : ''} | Total: ${formatThousand(newTotalUnit)} UNIT (${formatThousand(Math.round(newTotalML))} ML)`,
      deltaSummary: `${deltaML >= 0 ? '+' : ''}${formatThousand(deltaUnit)} UNIT (${deltaML >= 0 ? '+' : ''}${formatThousand(deltaML, 2)} ML)`
    };
  }

  // 3. KATEGORI STANDAR (Tools & Equipment)
  const currentUtama = details.utama;
  let newUtama = currentUtama;
  if (mode === 'add') newUtama = currentUtama + Math.round(pVal);
  else if (mode === 'deduct') newUtama = Math.max(0, currentUtama - Math.round(pVal));
  else if (mode === 'set') newUtama = Math.max(0, Math.round(pVal));

  const diffUtama = newUtama - currentUtama;

  return {
    stokUtama: newUtama,
    stokPecahan: 0,
    diffUtama,
    diffPecahan: 0,
    hasChanged: diffUtama !== 0,
    exceedsStock: mode === 'deduct' && pVal > currentUtama,
    actionSummary: `${formatThousand(pVal)} ${details.satuan}`,
    resultSummary: `${formatThousand(newUtama)} ${details.satuan}`,
    deltaSummary: `${diffUtama >= 0 ? '+' : ''}${formatThousand(diffUtama)} ${details.satuan}`
  };
};
