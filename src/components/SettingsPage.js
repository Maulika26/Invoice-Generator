'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { CURRENCIES } from '@/lib/gst';
import Toast from '@/components/Toast';
import { Save, Upload, Loader2, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_gstin: '',
    currency: 'INR',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || '',
        company_address: profile.company_address || '',
        company_phone: profile.company_phone || '',
        company_email: profile.company_email || '',
        company_gstin: profile.company_gstin || '',
        currency: profile.currency || 'INR',
      });
      if (profile.company_logo_url) {
        setLogoPreview(profile.company_logo_url);
      }
    }
  }, [profile]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let logoUrl = profile?.company_logo_url || '';

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${profile?.id || 'unknown'}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(fileName);
          logoUrl = publicUrl;
        } else {
          console.error('Logo upload error:', uploadError);
          setToast({ message: 'Failed to upload logo', type: 'error' });
          return;
        }
      }

      const res = await updateProfile({
        ...form,
        company_logo_url: logoUrl,
      });

      if (!res || res.error) {
        setToast({ message: 'Failed to save settings', type: 'error' });
      } else {
        setToast({ message: 'Settings saved successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your company profile and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Building2 size={20} /> Company Logo
            </h2>
          </div>
          <label className="logo-upload-area">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="logo-preview" style={{ margin: '0 auto var(--space-3)' }} />
            ) : (
              <Upload size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }} />
            )}
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {logoPreview ? 'Click to change logo' : 'Click to upload your company logo'}
            </p>
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h2 className="card-title">Company Details</h2>
          </div>
          <div className="form-grid" style={{ gap: 'var(--space-4)' }}>
            <div className="input-group">
              <label htmlFor="settings-name">Company Name</label>
              <input id="settings-name" className="input" placeholder="Your Company Name"
                value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="settings-email">Email</label>
                <input id="settings-email" type="email" className="input" placeholder="company@email.com"
                  value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} />
              </div>
              <div className="input-group">
                <label htmlFor="settings-phone">Phone</label>
                <input id="settings-phone" className="input" placeholder="+91 98765 43210"
                  value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="settings-address">Address</label>
              <textarea id="settings-address" className="input" placeholder="Full company address"
                value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="settings-gstin">GSTIN</label>
                <input id="settings-gstin" className="input" placeholder="22AAAAA0000A1Z5"
                  value={form.company_gstin} onChange={(e) => setForm({ ...form, company_gstin: e.target.value })} />
              </div>
              <div className="input-group">
                <label htmlFor="settings-currency">Default Currency</label>
                <select id="settings-currency" className="input"
                  value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? <Loader2 size={18} className="spinning" /> : <><Save size={18} /> Save Settings</>}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
