'use client';

import { useTheme } from '@/context/ThemeContext';
import { Menu, Sun, Moon, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="btn btn-icon btn-ghost show-mobile-only" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="header-brand show-mobile-only">
          <span className="header-brand-text">InvoiceFlow</span>
        </div>
      </div>
      <div className="header-right">
        <Link href="/invoices/new" className="btn btn-primary btn-sm">
          <Plus size={16} />
          <span className="hide-mobile">New Invoice</span>
        </Link>
        <button
          className="btn btn-icon btn-ghost btn-sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
