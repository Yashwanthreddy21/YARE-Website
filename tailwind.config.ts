import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      borderRadius: { '2xl': '1.25rem' },
      boxShadow: { card: '0 10px 30px rgba(15, 23, 42, 0.07)' },
    },
  },
  plugins: [],
};
export default config;
