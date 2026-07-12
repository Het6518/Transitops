import { useEffect } from 'react';

/**
 * Modal — generic dialog overlay.
 * Children = form/content. onClose dismisses it.
 */
export default function Modal({ title, onClose, children, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const SIZE = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-brand-dark rounded-2xl shadow-2xl w-full ${SIZE[size]} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark-raised">
          <h2 className="text-ink-onDark font-semibold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-onDarkMuted hover:text-ink-onDark transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-dark-raised focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
