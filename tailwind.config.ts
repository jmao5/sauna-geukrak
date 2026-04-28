import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-main': 'var(--bg-main)',
        'bg-sub': 'var(--bg-sub)',
        'bg-card': 'var(--bg-card)',
        'bg-elevated': 'var(--bg-elevated)',
        'text-main': 'var(--text-main)',
        'text-sub': 'var(--text-sub)',
        'text-muted': 'var(--text-muted)',
        'border-main': 'var(--border-main)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        point: 'var(--point-color)',
        'point-hover': 'var(--point-hover)',
        sauna: 'var(--sauna-color)',
        'sauna-bg': 'var(--sauna-bg)',
        'sauna-text': 'var(--sauna-text)',
        cold: 'var(--cold-color)',
        'cold-bg': 'var(--cold-bg)',
        'cold-text': 'var(--cold-text)',
        danger: '#dc2626',
        success: '#22c55e',
        warning: '#facc15',
        gold: '#fbbf24',
        silver: '#9ca3af',
      },
      fontFamily: {
        pretendard: ['var(--font-pretendard)', '-apple-system', 'sans-serif'],
        juache: ['var(--font-juache)', 'sans-serif'],
      },
      boxShadow: {
        nav: 'var(--shadow-nav)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      zIndex: {
        navbar: '50',
        bottomSheet: '100',
        toast: '110',
        pwaInstallBanner: '120',
      },
    },
  },
  plugins: [],
}

export default config
