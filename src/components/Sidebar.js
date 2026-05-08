'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, FileText, Users, Package,
  Settings, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed && !mobileOpen ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-header">
          {showLabels && (
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">
                <FileText size={20} />
              </div>
              <span className="sidebar-brand-text">InvoiceFlow</span>
            </div>
          )}
          <button
            className="btn btn-icon btn-ghost btn-sm hide-mobile"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            className="btn btn-icon btn-ghost btn-sm show-mobile-only"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${isActive(href) ? 'sidebar-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={!showLabels ? label : undefined}
            >
              <Icon size={20} />
              {showLabels && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {showLabels && profile && (
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {(profile.company_name || 'U')[0].toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{profile.company_name || 'My Company'}</span>
              </div>
            </div>
          )}
          <button
            className={`sidebar-link sidebar-logout`}
            onClick={signOut}
            title="Sign out"
          >
            <LogOut size={20} />
            {showLabels && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
