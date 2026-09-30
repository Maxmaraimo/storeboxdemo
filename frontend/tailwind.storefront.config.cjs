module.exports = {
  content: [
    '../templates/storefront/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: 'var(--brand-color)',
        'brand-dark': '#059669',
      },
    },
  },
  plugins: [],
};
