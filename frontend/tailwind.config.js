/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:        'var(--bg-panel)',
          'dark-raised':'var(--bg-panel-raised)',
          light:       'var(--bg-main)',
        },
        ink: {
          onDark:      'var(--text-on-dark)',
          onDarkMuted: 'var(--text-muted)',
          onLight:     'var(--text-main)',
          muted:       'var(--text-muted)',
        },
        accent: {
          DEFAULT: '#C17817',
          hover:   '#A8650F',
        },
        status: {
          available:  '#2F9E44',
          ontrip:     '#3B82F6',
          inshop:     '#D97706',
          retired:    '#E5484D',
          draft:      '#8B93A7',
          completed:  '#2F9E44',
          dispatched: '#3B82F6',
          cancelled:  '#E5484D',
          offduty:    '#8B93A7',
          suspended:  '#E5484D',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Inter', 'sans-serif'],
        mono: ['"SF Mono"', '"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
