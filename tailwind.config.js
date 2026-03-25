import { themeColors, themeFonts } from './src/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: themeFonts.sans,
                display: themeFonts.display,
                roboto: themeFonts.roboto,
                manrope: ['Manrope', 'sans-serif'],
                headline: ['Manrope', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                label: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: themeColors.primary,
                'primary-hover': themeColors.hover,
                xynemaRose: themeColors.primary,
                background: themeColors.background,
                darkBackground: themeColors.darkBackground,
                text: themeColors.text,
                darkText: themeColors.darkText,
                charcoalSlate: '#3e7cb1',
                premiumGold: '#81a4cd',
                whiteSmoke: '#F5F5F5',
            },
            keyframes: {
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-in-left': {
                    '0%': { transform: 'translateX(-30px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-in-right': {
                    '0%': { transform: 'translateX(30px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'zoom-in': {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    }
                }
            },
            animation: {
                'slide-up': 'slide-up 0.5s ease-out forwards',
                'slide-in-left': 'slide-in-left 0.7s ease-out forwards',
                'slide-in-right': 'slide-in-right 0.7s ease-out forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'zoom-in': 'zoom-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
                'gradient-x': 'gradient-x 3s ease infinite',
            }
        },
    },
    plugins: [],
}
