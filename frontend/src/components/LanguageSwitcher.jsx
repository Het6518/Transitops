import { useEffect, useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'gu', label: 'ગુ', full: 'Gujarati' },
  { code: 'hi', label: 'हि', full: 'Hindi'    },
];

/**
 * LanguageSwitcher
 * ─────────────────
 * Loads Google Translate in headless mode and exposes three custom-styled
 * buttons (EN / gu / hi). The default GT toolbar is hidden via CSS in
 * index.css so only our buttons are visible.
 */
export default function LanguageSwitcher() {
  const [active, setActive] = useState('en');
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    // Callback Google Translate will invoke once loaded
    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,gu,hi',
          autoDisplay: false,
        },
        'gt-hidden-element'
      );
      setReady(true);
    };

    // Only inject the script once (check for double-mount in dev StrictMode)
    if (!document.getElementById('gt-script')) {
      const s = document.createElement('script');
      s.id  = 'gt-script';
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      s.async = true;
      document.head.appendChild(s);
    } else {
      // Script already injected (hot reload / StrictMode re-mount)
      setReady(true);
    }
  }, []);

  const switchLanguage = (code) => {
    setActive(code);

    if (code === 'en') {
      // Restore original language via the GT "restore" cookie trick
      const iframe = document.querySelector('.goog-te-banner-frame');
      if (iframe) {
        const btn = iframe.contentDocument?.querySelector('.goog-te-banner-frame__close');
        if (btn) btn.click();
      }
      // Most reliable: force-remove the translation cookie and reload
      const hostname = location.hostname;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
      location.reload();
      return;
    }

    // For non-English: trigger the hidden <select> that Google Translate renders
    const doSwitch = () => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event('change'));
      }
    };

    if (ready) {
      doSwitch();
    } else {
      // Retry a few times while the widget initialises
      let attempts = 0;
      const interval = setInterval(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) { combo.value = code; combo.dispatchEvent(new Event('change')); clearInterval(interval); }
        if (++attempts > 20) clearInterval(interval);
      }, 250);
    }
  };

  return (
    <>
      {/* Hidden container required by the GT widget – never visible */}
      <div id="gt-hidden-element" className="hidden" aria-hidden="true" />

      {/* Custom language buttons */}
      <div
        className="flex items-center gap-0.5 bg-brand-dark-raised rounded-lg p-0.5"
        role="group"
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            title={lang.full}
            aria-pressed={active === lang.code}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent notranslate ${
              active === lang.code
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-onDarkMuted hover:text-ink-onDark hover:bg-brand-dark'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </>
  );
}
