/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6', // Purple-500/600 base
          50: '#faf5ff',
          100: '#f3e8ff',
          600: '#9333ea',
          700: '#7e22ce',
        },
        secondary: '#6b7280', // Gray-500
        success: {
          DEFAULT: '#10b981', // Green
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          DEFAULT: '#ef4444', // Red
          50: '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b', // Orange/Yellow
          50: '#fefce8',
          100: '#fef9c3',
          600: '#ca8a04',
          700: '#a16207',
        },
        info: {
          DEFAULT: '#3b82f6', // Blue
          50: '#eff6ff',
          100: '#dbeafe',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}