'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, GST_RATES } from '@/lib/gst';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { Plus, Search, Edit2, Trash2, Package, Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', gst_rate: '18', unit: 'nos' });
  const supabase = createClient();
  const currency = profile?.currency || 'INR';

  useEffect(() => {
    if (authLoading) return;
    fetchProducts();
  }, [authLoading]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', gst_rate: '18', unit: 'nos' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), gst_rate: String(p.gst_rate), unit: p.unit || 'nos' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, price: parseFloat(form.price) || 0, gst_rate: parseFloat(form.gst_rate) || 0 };
    if (editing) {
      const { error } = await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) setToast({ message: 'Failed to update', type: 'error' });
      else setToast({ message: 'Product updated!', type: 'success' });
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) setToast({ message: 'Failed to add', type: 'error' });
      else setToast({ message: 'Product added!', type: 'success' });
    }
    setSaving(false);
    setModalOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setToast({ message: 'Product deleted', type: 'success' });
    fetchProducts();
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Services</h1>
          <p className="page-subtitle">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Add Product</button>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} />
          <input className="input" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Package size={48} /><h3>No products yet</h3><p>Add your products or services to reuse in invoices</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Product</th><th>Price</th><th>GST</th><th className="hide-mobile">Unit</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.description && <><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{p.description}</span></>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.price, currency)}</td>
                  <td><span className="badge badge-primary">{p.gst_rate}%</span></td>
                  <td className="hide-mobile">{p.unit}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={15} /></button>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name || !form.price}>
            {saving ? <Loader2 size={16} className="spinning" /> : (editing ? 'Update' : 'Add Product')}
          </button>
        </>}>
        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: 'var(--space-4)' }}>
          <div className="input-group"><label>Product/Service Name *</label><input className="input" placeholder="Web Development" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="input-group"><label>Description</label><textarea className="input" placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="input-group"><label>Price *</label><input type="number" step="0.01" className="input" placeholder="1000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <div className="input-group">
              <label>GST Rate</label>
              <select className="input" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}>
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Unit</label>
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="nos">Nos</option><option value="hrs">Hours</option><option value="days">Days</option>
              <option value="kg">Kg</option><option value="pcs">Pieces</option><option value="sq.ft">Sq.ft</option>
            </select>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
