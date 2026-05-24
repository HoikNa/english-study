/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#1A1714',
        'ink-2': '#3B342D',
        muted: '#8A8278',
        'muted-2': '#B8B0A4',
        paper: '#F5F0E6',
        'paper-2': '#EFEAE0',
        card: '#FFFFFF',
        line: '#E6DFD2',
        accent: '#E15A3C',
        'accent-soft': '#FBE3DC',
        sage: '#5B7A5B',
        'sage-soft': '#DCE6D9',
        gold: '#C99A3F',
        'gold-soft': '#F4E9CE',
        indigo: '#2E3A8C',
        'indigo-soft': '#DCDFF1',
        rose: '#B84A55',
        navy: {
          900: '#0D2B55',
        },
        blue: {
          700: '#1F4E8C',
          500: '#2E75B6',
        },
        teal: {
          700: '#0E7C7B',
          100: '#D0EFEE',
        },
      },
      fontFamily: {
        inter: ['Inter'],
        'inter-medium': ['InterMedium'],
        'inter-semibold': ['InterSemiBold'],
        'inter-bold': ['InterBold'],
        serif: ['InstrumentSerif'],
        'serif-italic': ['InstrumentSerifItalic'],
        mono: ['IBMPlexMono'],
        'mono-medium': ['IBMPlexMonoMedium'],
        'mono-semibold': ['IBMPlexMonoSemiBold'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
      spacing: {
        screen: '20px',
      },
    },
  },
  plugins: [],
};
