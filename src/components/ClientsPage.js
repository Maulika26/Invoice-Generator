'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { Plus, Search, Edit2, Trash2, Users, Loader2 } from 'lucide-react';

export default function ClientsPage() {
  const { loading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', gstin: '', state: '' });
  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;
    fetchClients();
  }, [authLoading]);

  const fetchClients = async () => {
    try {
      const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      setClients(data || []);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', address: '', gstin: '', state: '' });
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({ name: client.name, email: client.email || '', phone: client.phone || '',
      address: client.address || '', gstin: client.gstin || '', state: client.state || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('clients')
        .update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) setToast({ message: 'Failed to update client', type: 'error' });
      else setToast({ message: 'Client updated!', type: 'success' });
    } else {
      const { error } = await supabase.from('clients').insert([form]);
      if (error) setToast({ message: 'Failed to add client', type: 'error' });
      else setToast({ message: 'Client added!', type: 'success' });
    }
    setSaving(false);
    setModalOpen(false);
    fetchClients();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    setToast({ message: 'Client deleted', type: 'success' });
    fetchClients();
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Add Client</button>
      </div>

      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} />
          <input className="input" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Users size={48} /><h3>No clients found</h3><p>Add your first client to get started</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th className="hide-mobile">Email</th><th className="hide-mobile">Phone</th><th className="hide-mobile">GSTIN</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.state && <><br /><span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{c.state}</span></>}
                  </td>
                  <td className="hide-mobile">{c.email || '—'}</td>
                  <td className="hide-mobile">{c.phone || '—'}</td>
                  <td className="hide-mobile" style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>{c.gstin || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={15} /></button>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Client' : 'Add Client'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name}>
            {saving ? <Loader2 size={16} className="spinning" /> : (editing ? 'Update' : 'Add Client')}
          </button>
        </>}>
        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label>Client Name *</label>
            <input className="input" placeholder="Client or Company Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="input-group"><label>Email</label><input type="email" className="input" placeholder="client@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="input-group"><label>Phone</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="input-group"><label>Address</label><textarea className="input" placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="form-row">
            <div className="input-group"><label>GSTIN</label><input className="input" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
            <div className="input-group"><label>State</label><input className="input" placeholder="Maharashtra" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
