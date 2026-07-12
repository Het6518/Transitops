import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * PageLayout
 * ──────────
 * Persistent shell used by every authenticated page.
 * Sidebar (fixed left / drawer on mobile) + Topbar (fixed top-right) + scrollable content area.
 */
export default function PageLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      {/* Sidebar container */}
      <div className={`fixed inset-0 z-40 md:relative md:z-auto ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}>
        {/* Backdrop overlay for mobile */}
        <div 
          className="fixed inset-0 bg-black/50 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar itself */}
        <div className="relative z-50">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-brand-light p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
