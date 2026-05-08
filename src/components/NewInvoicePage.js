'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { calculateInvoiceTotals, formatCurrency, GST_RATES } from '@/lib/gst';
import Toast from '@/components/Toast';
import { Plus, Trash2, Save, Loader2, FileText } from 'lucide-react';

const emptyItem = { product_id: '', name: '', description: '', quantity: 1, price: 0, gst_rate: 18 };

export default function NewInvoicePage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const currency = profile?.currency || 'INR';

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    client_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    supply_type: 'intra-state',
    notes: '',
    terms: 'Payment is due within 30 days of the invoice date.',
    status: 'draft',
  });

  const [items, setItems] = useState([{ ...emptyItem }]);

  useEffect(() => {
    fetchData();
    generateInvoiceNumber();
  }, []);

  const fetchData = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
    ]);
    setClients(c || []);
    setProducts(p || []);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    setForm(f => ({ ...f, invoice_number: `INV-${y}${m}${d}-${rand}` }));
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const selectProduct = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = [...items];
      updated[idx] = {
        ...updated[idx],
        product_id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        gst_rate: product.gst_rate,
      };
      setItems(updated);
    }
  };

  const totals = calculateInvoiceTotals(items, form.supply_type);

  const handleSubmit = async (status = 'draft') => {
    if (!form.client_id) {
      setToast({ message: 'Please select a client', type: 'error' });
      return;
    }
    if (!items.some(i => i.name && i.price > 0)) {
      setToast({ message: 'Please add at least one item', type: 'error' });
      return;
    }

    setSaving(true);

    const { data: invoice, error } = await supabase.from('invoices').insert([{
      user_id: user.id,
      client_id: form.client_id,
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      total: totals.total,
      notes: form.notes,
      terms: form.terms,
      status: status,
      supply_type: form.supply_type,
    }]).select().single();

    if (error) {
      setToast({ message: 'Failed to create invoice', type: 'error' });
      setSaving(false);
      return;
    }

    const invoiceItems = totals.items
      .filter(i => i.name)
      .map(i => ({
        invoice_id: invoice.id,
        product_id: i.product_id || null,
        name: i.name,
        description: i.description || '',
        quantity: parseFloat(i.quantity) || 1,
        price: parseFloat(i.price) || 0,
        gst_rate: parseFloat(i.gst_rate) || 0,
        amount: i.amount,
      }));

    await supabase.from('invoice_items').insert(invoiceItems);

    setToast({ message: 'Invoice created!', type: 'success' });
    setTimeout(() => router.push(`/invoices/${invoice.id}`), 500);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Invoice</h1>
          <p className="page-subtitle">Fill in the details below</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="invoice-form-header">
          <div className="form-grid" style={{ gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label>Invoice Number</label>
              <input className="input" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Client *</label>
              <select className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid" style={{ gap: 'var(--space-4)' }}>
            <div className="form-row">
              <div className="input-group">
                <label>Invoice Date</label>
                <input type="date" className="input" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Due Date</label>
                <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label>Supply Type (GST)</label>
              <select className="input" value={form.supply_type} onChange={(e) => setForm({ ...form, supply_type: e.target.value })}>
                <option value="intra-state">Intra-State (CGST + SGST)</option>
                <option value="inter-state">Inter-State (IGST)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h2 className="card-title">Items</h2>
          <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={16} /> Add Item</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="line-items-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Item</th>
                <th style={{ width: 80 }}>Qty</th>
                <th style={{ width: 120 }}>Price</th>
                <th style={{ width: 90 }}>GST %</th>
                <th style={{ width: 120 }}>Amount</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <select className="input" value={item.product_id} onChange={(e) => selectProduct(idx, e.target.value)}
                      style={{ marginBottom: 'var(--space-1)', height: 32, fontSize: 'var(--font-size-xs)' }}>
                      <option value="">-- Select product or type below --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input className="input" placeholder="Item name" value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="input" min="1" step="0.01" value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td>
                    <input type="number" className="input" min="0" step="0.01" value={item.price}
                      onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td>
                    <select className="input" value={item.gst_rate}
                      onChange={(e) => updateItem(idx, 'gst_rate', parseFloat(e.target.value))}>
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </td>
                  <td className="line-item-amount">{formatCurrency(item.quantity * item.price, currency)}</td>
                  <td>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeItem(idx)}
                      disabled={items.length <= 1} style={{ color: 'var(--color-danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals">
          <table className="totals-table">
            <tbody>
              <tr><td>Subtotal</td><td>{formatCurrency(totals.subtotal, currency)}</td></tr>
              {form.supply_type === 'intra-state' ? (<>
                <tr><td>CGST</td><td>{formatCurrency(totals.cgst, currency)}</td></tr>
                <tr><td>SGST</td><td>{formatCurrency(totals.sgst, currency)}</td></tr>
              </>) : (
                <tr><td>IGST</td><td>{formatCurrency(totals.igst, currency)}</td></tr>
              )}
              <tr className="total-row"><td>Total</td><td>{formatCurrency(totals.total, currency)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="form-row">
          <div className="input-group">
            <label>Notes</label>
            <textarea className="input" placeholder="Thank you for your business!" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Terms & Conditions</label>
            <textarea className="input" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={() => handleSubmit('draft')} disabled={saving}>
          {saving ? <Loader2 size={18} className="spinning" /> : <><Save size={18} /> Save as Draft</>}
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => handleSubmit('sent')} disabled={saving}>
          <FileText size={18} /> Save & Send
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
