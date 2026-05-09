'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/gst';
import Link from 'next/link';
import {
  FileText, Users, Package, Plus, TrendingUp,
  IndianRupee, Clock, ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ invoices: 0, revenue: 0, pending: 0, clients: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const currency = profile?.currency || 'INR';

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish

    // Safety timeout - never stay loading for more than 8 seconds
    const timeout = setTimeout(() => {
      console.warn('[Dashboard] Safety timeout reached, forcing loading=false');
      setLoading(false);
    }, 8000);

    fetchDashboardData().finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [authLoading]);

  const fetchDashboardData = async () => {
    try {
      console.log('[Dashboard] Fetching data...');
      
      // Fetch invoice stats
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total, status, clients(name)')
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('[Dashboard] Invoice fetch error:', invoiceError);
      }

      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id');

      if (clientError) {
        console.error('[Dashboard] Client fetch error:', clientError);
      }

      console.log('[Dashboard] Fetched invoices:', invoices?.length, 'clients:', clients?.length);

      const allInvoices = invoices || [];
      const totalRevenue = allInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
      const pendingAmount = allInvoices
        .filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      setStats({
        invoices: allInvoices.length,
        revenue: totalRevenue,
        pending: pendingAmount,
        clients: clients?.length || 0,
      });

      setRecentInvoices(allInvoices.slice(0, 5));
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      paid: 'badge-success',
      sent: 'badge-warning',
      draft: 'badge-info',
    };
    return `badge ${map[status] || 'badge-info'}`;
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}!</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <FileText size={22} />
          </div>
          <div className="stats-content">
            <div className="stats-label">Total Invoices</div>
            <div className="stats-value">{stats.invoices}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stats-content">
            <div className="stats-label">Revenue</div>
            <div className="stats-value">{formatCurrency(stats.revenue, currency)}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
            <Clock size={22} />
          </div>
          <div className="stats-content">
            <div className="stats-label">Pending</div>
            <div className="stats-value">{formatCurrency(stats.pending, currency)}</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
            <Users size={22} />
          </div>
          <div className="stats-content">
            <div className="stats-label">Clients</div>
            <div className="stats-value">{stats.clients}</div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Invoices</h2>
            <Link href="/invoices" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <FileText size={40} />
              <h3>No invoices yet</h3>
              <p>Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="recent-table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link href={`/invoices/${inv.id}`} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                          {inv.invoice_number}
                        </Link>
                        <br />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>{inv.clients?.name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total, currency)}</td>
                      <td><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link href="/invoices/new" className="quick-action-btn">
              <div className="quick-action-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <Plus size={18} />
              </div>
              Create Invoice
            </Link>
            <Link href="/clients" className="quick-action-btn">
              <div className="quick-action-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                <Users size={18} />
              </div>
              Add Client
            </Link>
            <Link href="/products" className="quick-action-btn">
              <div className="quick-action-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                <Package size={18} />
              </div>
              Add Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
