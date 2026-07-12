import Navbar from './Navbar';

/**
 * PageLayout
 * ──────────
 * Persistent shell used by every authenticated page.
 * Sticky Top Navbar + scrollable content area.
 */
export default function PageLayout({ title, children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-light">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink-onLight">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
