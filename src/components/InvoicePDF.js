'use client';

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1d2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#4f46e5' },
  logo: { width: 120, height: 120, objectFit: 'contain', marginBottom: 10 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companyDetail: { fontSize: 9, color: '#5f6580', marginBottom: 2 },
  invoiceTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#4f46e5', textAlign: 'right' },
  invoiceNumber: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right', marginTop: 4 },
  statusBadge: { fontSize: 9, padding: '3 10', borderRadius: 10, textAlign: 'center', marginTop: 6, alignSelf: 'flex-end' },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metaSection: { flex: 1 },
  metaLabel: { fontSize: 8, color: '#8b90a5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  metaValue: { fontSize: 10, marginBottom: 2 },
  metaName: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f3f9', borderBottomWidth: 1, borderBottomColor: '#e2e5ef', paddingVertical: 8, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#5f6580', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eef0f6', paddingVertical: 8, paddingHorizontal: 8 },
  tableRowAlt: { backgroundColor: '#fafbfd' },
  tableCell: { fontSize: 9 },
  tableCellBold: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  colNum: { width: '5%' },
  colItem: { width: '28%' },
  colQty: { width: '8%', textAlign: 'center' },
  colPrice: { width: '13%', textAlign: 'right' },
  colGst: { width: '8%', textAlign: 'center' },
  colTax1: { width: '13%', textAlign: 'right' },
  colTax2: { width: '13%', textAlign: 'right' },
  colAmount: { width: '12%', textAlign: 'right' },
  // For IGST mode (wider columns)
  colTaxIgst: { width: '13%', textAlign: 'right' },
  colAmountIgst: { width: '25%', textAlign: 'right' },
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsTable: { width: 250 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8 },
  totalsLabel: { fontSize: 10, color: '#5f6580' },
  totalsValue: { fontSize: 10, textAlign: 'right' },
  totalsFinal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 2, borderTopColor: '#1a1d2e', marginTop: 4 },
  totalsFinalLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  totalsFinalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  footer: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e2e5ef' },
  footerLabel: { fontSize: 8, color: '#8b90a5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  footerText: { fontSize: 9, color: '#5f6580', lineHeight: 1.5 },
  pageNumber: { position: 'absolute', bottom: 20, right: 40, fontSize: 8, color: '#8b90a5' },
});

function formatCurrencyPDF(amount, currency = 'INR') {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', JPY: '¥', AED: 'AED ', SGD: 'S$' };
  const sym = symbols[currency] || '₹';
  const num = parseFloat(amount) || 0;
  return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcLineTax(qty, price, gstRate, supplyType) {
  const amount = qty * price;
  const tax = (amount * gstRate) / 100;
  if (supplyType === 'inter-state') return { cgst: 0, sgst: 0, igst: tax, total: amount + tax };
  return { cgst: tax / 2, sgst: tax / 2, igst: 0, total: amount + tax };
}

export default function InvoicePDF({ invoice, items, client, profile, currency = 'INR' }) {
  const supplyType = invoice.supply_type || 'intra-state';
  const isIntra = supplyType === 'intra-state';

  const statusColor = { paid: '#059669', sent: '#d97706', draft: '#5f6580' };
  const statusBg = { paid: '#ecfdf5', sent: '#fffbeb', draft: '#f1f3f9' };

  // Proxy the image to bypass CORS when rendering on the client
  // Note: @react-pdf/renderer crashes on SVGs, so we must ignore them
  const isSvg = profile?.company_logo_url?.toLowerCase().includes('.svg');
  const logoSrc = profile?.company_logo_url && !isSvg
    ? `/api/proxy-image?url=${encodeURIComponent(profile.company_logo_url)}` 
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ maxWidth: '55%' }}>
            {logoSrc && (
              <Image src={logoSrc} style={styles.logo} />
            )}
            <Text style={styles.companyName}>{profile?.company_name || 'Your Company'}</Text>
            {profile?.company_address && <Text style={styles.companyDetail}>{profile.company_address}</Text>}
            {profile?.company_phone && <Text style={styles.companyDetail}>Phone: {profile.company_phone}</Text>}
            {profile?.company_email && <Text style={styles.companyDetail}>Email: {profile.company_email}</Text>}
            {profile?.company_gstin && <Text style={styles.companyDetail}>GSTIN: {profile.company_gstin}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg[invoice.status] || '#f1f3f9', color: statusColor[invoice.status] || '#5f6580' }]}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: statusColor[invoice.status] || '#5f6580' }}>
                {(invoice.status || 'draft').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Meta Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaSection}>
            <Text style={styles.metaLabel}>Bill To</Text>
            <Text style={styles.metaName}>{client?.name || '—'}</Text>
            {client?.address && <Text style={styles.metaValue}>{client.address}</Text>}
            {client?.email && <Text style={styles.metaValue}>{client.email}</Text>}
            {client?.phone && <Text style={styles.metaValue}>{client.phone}</Text>}
            {client?.gstin && <Text style={styles.metaValue}>GSTIN: {client.gstin}</Text>}
          </View>
          <View style={[styles.metaSection, { alignItems: 'flex-end' }]}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={[styles.metaValue, { marginBottom: 10 }]}>
              {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {invoice.due_date && <>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colGst]}>GST%</Text>
            {isIntra ? (
              <>
                <Text style={[styles.tableHeaderCell, styles.colTax1]}>CGST</Text>
                <Text style={[styles.tableHeaderCell, styles.colTax2]}>SGST</Text>
              </>
            ) : (
              <Text style={[styles.tableHeaderCell, styles.colTaxIgst]}>IGST</Text>
            )}
            <Text style={[styles.tableHeaderCell, isIntra ? styles.colAmount : styles.colAmountIgst]}>Amount</Text>
          </View>

          {(items || []).map((item, idx) => {
            const tax = calcLineTax(item.quantity, item.price, item.gst_rate, supplyType);
            return (
              <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.colNum]}>{idx + 1}</Text>
                <View style={styles.colItem}>
                  <Text style={styles.tableCellBold}>{item.name}</Text>
                  {item.description ? <Text style={{ fontSize: 8, color: '#8b90a5' }}>{item.description}</Text> : null}
                </View>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrencyPDF(item.price, currency)}</Text>
                <Text style={[styles.tableCell, styles.colGst]}>{item.gst_rate}%</Text>
                {isIntra ? (
                  <>
                    <Text style={[styles.tableCell, styles.colTax1]}>{formatCurrencyPDF(tax.cgst, currency)}</Text>
                    <Text style={[styles.tableCell, styles.colTax2]}>{formatCurrencyPDF(tax.sgst, currency)}</Text>
                  </>
                ) : (
                  <Text style={[styles.tableCell, styles.colTaxIgst]}>{formatCurrencyPDF(tax.igst, currency)}</Text>
                )}
                <Text style={[styles.tableCellBold, isIntra ? styles.colAmount : styles.colAmountIgst]}>
                  {formatCurrencyPDF(tax.total, currency)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrencyPDF(invoice.subtotal, currency)}</Text>
            </View>
            {isIntra ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>CGST</Text>
                  <Text style={styles.totalsValue}>{formatCurrencyPDF(invoice.tax_total / 2, currency)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>SGST</Text>
                  <Text style={styles.totalsValue}>{formatCurrencyPDF(invoice.tax_total / 2, currency)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IGST</Text>
                <Text style={styles.totalsValue}>{formatCurrencyPDF(invoice.tax_total, currency)}</Text>
              </View>
            )}
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>Total</Text>
              <Text style={styles.totalsFinalValue}>{formatCurrencyPDF(invoice.total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.footer}>
            {invoice.notes && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.footerLabel}>Notes</Text>
                <Text style={styles.footerText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View>
                <Text style={styles.footerLabel}>Terms & Conditions</Text>
                <Text style={styles.footerText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
