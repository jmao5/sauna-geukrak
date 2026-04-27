import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    // src 폴더 없이 바로 접근하는 경로 설정
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        danger: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          ring: '#f87171',
        },
        success: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          ring: '#4ade80',
        },
        warning: {
          DEFAULT: '#facc15',
          hover: '#eab308',
          ring: '#fde047',
        },
        light: {
          gray: '#d1d5db',
          main: '#f8f8f8',
          sub: '#ffffff',
          point: {
            DEFAULT: '#60d4de',
            hover: '#3fb7c1',
            ring: '#70e3ed',
          },
        },
        dark: {
          gray: '#9ca3af',
          main: '#1f2544',
          sub: '#121837',
          point: {
            DEFAULT: '#f9bd7d',
            hover: '#f0aa60',
            ring: '#ffc588',
          },
        },
        gold: '#FBBF24',
        silver: '#9ca3af',
        bronze: '#854d0e',
        disabled: '#93a3af',
        confirm: '#10B981',
        info: '#F9BD7D',
      },
      fontFamily: {
        omyuPretty: ['omyu_pretty'],
      },
      boxShadow: {
        nav: '0px -1px 4px 0px rgba(0, 0, 0, 0.25)',
        bottom: '0px 1px 0px 0px #d1d5db',
      },
      borderWidth: {
        DEFAULT: '1px',
        0: '0',
        1: '1px',
        2: '2px',
        3: '3px',
        4: '4px',
        5: '5px',
        6: '6px',
        7: '7px',
        8: '8px',
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
