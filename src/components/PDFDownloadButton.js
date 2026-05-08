'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { Download, Loader2 } from 'lucide-react';

export default function PDFDownloadButton({ invoice, items, client, profile, currency }) {
  return (
    <PDFDownloadLink
      document={
        <InvoicePDF
          invoice={invoice}
          items={items}
          client={client}
          profile={profile}
          currency={currency}
        />
      }
      fileName={`${invoice.invoice_number || 'invoice'}.pdf`}
    >
      {({ loading: pdfLoading }) => (
        <button className="btn btn-secondary btn-sm" disabled={pdfLoading}>
          {pdfLoading ? (
            <><Loader2 size={16} className="spinning" /> Generating...</>
          ) : (
            <><Download size={16} /> Download PDF</>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
