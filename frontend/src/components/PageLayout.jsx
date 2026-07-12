import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * PageLayout
 * ──────────
 * Persistent shell used by every authenticated page.
 * Sidebar (fixed left) + Topbar (fixed top-right) + scrollable content area.
 */
export default function PageLayout({ title, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto bg-brand-light p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
