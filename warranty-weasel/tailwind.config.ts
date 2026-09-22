import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        buy: '#22c55e',
        caution: '#f59e0b',
        avoid: '#ef4444',
        unknown: '#6b7280',
      },
    },
  },
  plugins: [],
}
export default config
