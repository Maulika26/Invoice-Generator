'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/gst';
import Link from 'next/link';
import { Plus, Search, FileText, Eye, Edit2, Trash2, Copy, Mail } from 'lucide-react';
import Toast from '@/components/Toast';

export default function InvoicesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const supabase = createClient();
  const currency = profile?.currency || 'INR';

  useEffect(() => {
    if (authLoading) return;
    fetchInvoices();
  }, [authLoading]);

  const fetchInvoices = async () => {
    try {
      const { data } = await supabase.from('invoices')
        .select('*, clients(name)').order('created_at', { ascending: false });
      setInvoices(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    await supabase.from('invoices').delete().eq('id', id);
    setToast({ message: 'Invoice deleted', type: 'success' });
    fetchInvoices();
  };

  const handleDuplicate = async (inv) => {
    const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);

    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');

    const { data: newInv } = await supabase.from('invoices').insert([{
      user_id: inv.user_id,
      client_id: inv.client_id,
      invoice_number: `INV-${y}${m}${d}-${rand}`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: inv.due_date,
      subtotal: inv.subtotal,
      tax_total: inv.tax_total,
      total: inv.total,
      notes: inv.notes,
      terms: inv.terms,
      status: 'draft',
      supply_type: inv.supply_type,
    }]).select().single();

    if (newInv && items) {
      const newItems = items.map(i => ({
        invoice_id: newInv.id,
        product_id: i.product_id,
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        price: i.price,
        gst_rate: i.gst_rate,
        amount: i.amount,
      }));
      await supabase.from('invoice_items').insert(newItems);
    }

    setToast({ message: 'Invoice duplicated!', type: 'success' });
    fetchInvoices();
  };

  const statusBadge = (status) => {
    const map = { paid: 'badge-success', sent: 'badge-warning', draft: 'badge-info' };
    return `badge ${map[status] || 'badge-info'}`;
  };

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary"><Plus size={18} /> New Invoice</Link>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} />
          <input className="input" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><FileText size={48} /><h3>No invoices found</h3><p>Create your first invoice to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th className="hide-mobile">Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link href={`/invoices/${inv.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td>{inv.clients?.name || '—'}</td>
                  <td className="hide-mobile">{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, currency)}</td>
                  <td><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <Link href={`/invoices/${inv.id}`} className="btn btn-icon btn-ghost btn-sm"><Eye size={15} /></Link>
                      <Link href={`/invoices/${inv.id}/edit`} className="btn btn-icon btn-ghost btn-sm"><Edit2 size={15} /></Link>
                      {inv.status !== 'paid' && (
                        <Link href={`/invoices/${inv.id}`} className="btn btn-icon btn-ghost btn-sm" title="Send Invoice" style={{ color: 'var(--color-primary)' }}><Mail size={15} /></Link>
                      )}
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDuplicate(inv)} title="Duplicate"><Copy size={15} /></button>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(inv.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
