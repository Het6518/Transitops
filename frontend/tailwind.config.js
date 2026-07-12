/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:        '#371367',
          'dark-raised':'#45197D',
          light:       '#EDE8F5',
        },
        ink: {
          onDark:      '#F5F3FA',
          onDarkMuted: '#B9A9D9',
          onLight:     '#241246',
          muted:       '#6B5E85',
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
