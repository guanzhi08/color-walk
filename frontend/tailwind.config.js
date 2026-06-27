/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pikmin: {
          green:    '#7DC87B',
          softgreen:'#A8D8A8',
          cream:    '#FFF8F0',
          peach:    '#FFD6B0',
          bark:     '#8B6F47',
          leaf:     '#4A7C59',
          sky:      '#B8E4F9',
          mist:     '#E8F5E9',
        },
      },
      fontFamily: {
        round: ['"Nunito"', 'ui-rounded', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      boxShadow: {
        soft: '0 2px 12px 0 rgba(125,200,123,0.15)',
        card: '0 4px 20px 0 rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}
