'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, calculateLineItemTax } from '@/lib/gst';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Edit2, Copy, Download, Printer, Trash2, CheckCircle, Mail, Loader2 } from 'lucide-react';

const InvoicePDFDownload = dynamic(() => import('@/components/PDFDownloadButton'), { ssr: false });

export default function InvoiceDetailPage({ params }) {
  const resolvedParams = params;
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const currency = profile?.currency || 'INR';

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchInvoice();
  }, [authLoading, resolvedParams?.id]);

  const fetchInvoice = async () => {
    console.log('Fetching invoice for ID:', resolvedParams?.id);
    try {
      const { data: inv, error: invError } = await supabase.from('invoices')
        .select('*, clients(*)').eq('id', resolvedParams?.id).single();
      
      console.log('Invoice fetch result:', { inv, invError });

      const { data: invoiceItems, error: itemsError } = await supabase.from('invoice_items')
        .select('*').eq('invoice_id', resolvedParams?.id).order('created_at');

      console.log('Invoice items fetch result:', { invoiceItems, itemsError });

      if (inv) {
        setInvoice(inv);
        setClient(inv.clients);
        setItems(invoiceItems || []);
      }
    } catch (err) {
      console.error('Error in fetchInvoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    await supabase.from('invoices').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', invoice.id);
    setToast({ message: 'Invoice marked as paid!', type: 'success' });
    fetchInvoice();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
    await supabase.from('invoices').delete().eq('id', invoice.id);
    router.push('/invoices');
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Failed to send email', type: 'error' });
      } else {
        setToast({ message: data.message || 'Invoice sent successfully!', type: 'success' });
        fetchInvoice(); // Refresh to show updated status
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    setSendingEmail(false);
    setEmailModalOpen(false);
  };

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>;

  const supplyType = invoice.supply_type || 'intra-state';

  return (
    <div className="invoice-detail">
      <div className="no-print">
        <Link href="/invoices" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
          <ArrowLeft size={16} /> Back to Invoices
        </Link>

        <div className="invoice-actions-bar">
          {invoice.status !== 'paid' && (
            <button className="btn btn-primary btn-sm" onClick={markAsPaid}><CheckCircle size={16} /> Mark Paid</button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setEmailModalOpen(true)}
            disabled={!client?.email}
            title={!client?.email ? 'Client has no email address' : `Send to ${client.email}`}
          >
            <Mail size={16} /> Send Email
          </button>
          <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-secondary btn-sm"><Edit2 size={16} /> Edit</Link>
          {profile && (
            <InvoicePDFDownload invoice={invoice} items={items} client={client} profile={profile} currency={currency} />
          )}
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Printer size={16} /> Print</button>
          <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /> Delete</button>
        </div>
      </div>

      <div className="invoice-detail-card">
        {/* Company Header */}
        <div className="invoice-company-header">
          <div>
            {profile?.company_logo_url && (
              <img src={profile.company_logo_url} alt="Logo" className="invoice-company-logo" style={{ marginBottom: 'var(--space-2)' }} />
            )}
            <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>{profile?.company_name || 'Your Company'}</h3>
            {profile?.company_address && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>{profile.company_address}</p>}
            {profile?.company_phone && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{profile.company_phone}</p>}
            {profile?.company_gstin && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>GSTIN: {profile.company_gstin}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 className="invoice-title">INVOICE</h1>
            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{invoice.invoice_number}</p>
            <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : invoice.status === 'sent' ? 'badge-warning' : 'badge-info'}`} style={{ marginTop: 'var(--space-2)' }}>
              {invoice.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="invoice-meta-grid">
          <div>
            <div className="invoice-meta-label">Bill To</div>
            <h4 style={{ fontWeight: 600 }}>{client?.name || '—'}</h4>
            {client?.address && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client.address}</p>}
            {client?.email && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client.email}</p>}
            {client?.phone && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client.phone}</p>}
            {client?.gstin && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>GSTIN: {client.gstin}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div className="invoice-meta-label">Invoice Date</div>
              <p style={{ fontWeight: 500 }}>{new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {invoice.due_date && (
              <div>
                <div className="invoice-meta-label">Due Date</div>
                <p style={{ fontWeight: 500 }}>{new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container" style={{ marginBottom: 'var(--space-6)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>GST%</th>
                {supplyType === 'intra-state' ? (<><th>CGST</th><th>SGST</th></>) : (<th>IGST</th>)}
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const lineAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                const tax = calculateLineItemTax(lineAmount, parseFloat(item.gst_rate) || 0, supplyType);
                return (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      {item.description && <><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{item.description}</span></>}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price, currency)}</td>
                    <td>{item.gst_rate}%</td>
                    {supplyType === 'intra-state' ? (
                      <><td>{formatCurrency(tax.cgst, currency)}</td><td>{formatCurrency(tax.sgst, currency)}</td></>
                    ) : (
                      <td>{formatCurrency(tax.igst, currency)}</td>
                    )}
                    <td style={{ fontWeight: 600 }}>{formatCurrency(tax.totalWithTax, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-totals">
          <table className="totals-table">
            <tbody>
              <tr><td>Subtotal</td><td>{formatCurrency(invoice.subtotal, currency)}</td></tr>
              {supplyType === 'intra-state' ? (<>
                <tr><td>CGST</td><td>{formatCurrency(invoice.tax_total / 2, currency)}</td></tr>
                <tr><td>SGST</td><td>{formatCurrency(invoice.tax_total / 2, currency)}</td></tr>
              </>) : (
                <tr><td>IGST</td><td>{formatCurrency(invoice.tax_total, currency)}</td></tr>
              )}
              <tr className="total-row"><td>Total</td><td>{formatCurrency(invoice.total, currency)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
            {invoice.notes && <div style={{ marginBottom: 'var(--space-4)' }}>
              <div className="invoice-meta-label">Notes</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{invoice.notes}</p>
            </div>}
            {invoice.terms && <div>
              <div className="invoice-meta-label">Terms & Conditions</div>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{invoice.terms}</p>
            </div>}
          </div>
        )}
      </div>

      {/* Send Email Confirmation Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => !sendingEmail && setEmailModalOpen(false)}
        title="Send Invoice via Email"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSendEmail} disabled={sendingEmail}>
            {sendingEmail ? <><Loader2 size={16} className="spinning" /> Sending...</> : <><Mail size={16} /> Send Invoice</>}
          </button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
            This will send invoice <strong>{invoice.invoice_number}</strong> as a PDF attachment to:
          </p>
          <div style={{
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}>
            <Mail size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{client?.name}</p>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{client?.email}</p>
            </div>
          </div>
          <div style={{
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Total Amount</span>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>{formatCurrency(invoice.total, currency)}</span>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
