/**
 * GST Calculation Utilities for Indian Taxation
 * 
 * Intra-state supply: CGST + SGST (each = GST rate / 2)
 * Inter-state supply: IGST (= full GST rate)
 */

export function calculateLineItemTax(amount, gstRate, supplyType = 'intra-state') {
  const taxAmount = (amount * gstRate) / 100;

  if (supplyType === 'inter-state') {
    return {
      cgst: 0,
      sgst: 0,
      igst: round(taxAmount),
      taxAmount: round(taxAmount),
      totalWithTax: round(amount + taxAmount),
    };
  }

  // Intra-state: split equally between CGST and SGST
  const halfTax = taxAmount / 2;
  return {
    cgst: round(halfTax),
    sgst: round(halfTax),
    igst: 0,
    taxAmount: round(taxAmount),
    totalWithTax: round(amount + taxAmount),
  };
}

export function calculateInvoiceTotals(items, supplyType = 'intra-state') {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const calculatedItems = items.map((item) => {
    const amount = round(item.quantity * item.price);
    const tax = calculateLineItemTax(amount, item.gst_rate, supplyType);

    subtotal += amount;
    totalCgst += tax.cgst;
    totalSgst += tax.sgst;
    totalIgst += tax.igst;

    return {
      ...item,
      amount,
      ...tax,
    };
  });

  return {
    items: calculatedItems,
    subtotal: round(subtotal),
    cgst: round(totalCgst),
    sgst: round(totalSgst),
    igst: round(totalIgst),
    taxTotal: round(totalCgst + totalSgst + totalIgst),
    total: round(subtotal + totalCgst + totalSgst + totalIgst),
  };
}

export function formatCurrency(amount, currency = 'INR') {
  const currencyConfig = {
    INR: { locale: 'en-IN', code: 'INR', symbol: '₹' },
    USD: { locale: 'en-US', code: 'USD', symbol: '$' },
    EUR: { locale: 'de-DE', code: 'EUR', symbol: '€' },
    GBP: { locale: 'en-GB', code: 'GBP', symbol: '£' },
    AUD: { locale: 'en-AU', code: 'AUD', symbol: 'A$' },
    CAD: { locale: 'en-CA', code: 'CAD', symbol: 'C$' },
    JPY: { locale: 'ja-JP', code: 'JPY', symbol: '¥' },
    AED: { locale: 'ar-AE', code: 'AED', symbol: 'د.إ' },
    SGD: { locale: 'en-SG', code: 'SGD', symbol: 'S$' },
  };

  const config = currencyConfig[currency] || currencyConfig.INR;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

export const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

function round(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
