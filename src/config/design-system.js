/**
 * Design System & Branding
 * Professional, Premium UI/UX Configuration
 */

// ============= Color Palette =============
export const colors = {
  // Primary Brand Colors (Xynema Premium Blue)
  primary: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fe6b7f',
    500: '#FD4960',     // Main Brand Pink (xynemaRose)
    600: '#e33d52',     // Darker shade
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // Secondary/Accent Colors (Xynema Gold/Blue)
  secondary: { // rebranded from charcoalSlate
    50: '#fdfcfe',
    100: '#fbf9fd',
    200: '#f5f0f9',
    300: '#efe6f5',
    400: '#dfcbf0',
    500: '#81a4cd',     // Accent (premiumGold)
    600: '#E33D52',     // Charcoal Slate
    700: '#2c5980',
    800: '#1d3b55',
    900: '#0f1d2b',
  },

  // Status Colors
  status: {
    success: '#4abd5d',
    warning: '#ff9800',
    error: '#FD4960',     // Xynema Rose for high-contrast alerts
    info: '#FD4960',
    pending: '#ff9800',
  },

  // Neutrals (Light Theme Foundation)
  neutral: {
    50: '#F5F5F5',      // White Smoke background
    100: '#eeeeee',
    200: '#e0e0e0',
    300: '#bdbdbd',
    400: '#9e9e9e',
    500: '#757575',
    600: '#616161',
    700: '#424242',
    800: '#333333',     // Main header text
    900: '#212121',
  },

  // Semantic mappings
  neutrals: {
    light: '#ffffff',
    background: '#F5F5F5',
    border: '#e5e5e5',
    dark: '#333333',
    grey: '#666666',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(90deg, #FD4960 0%, #e33d52 100%)',
    overlay: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
    light: 'linear-gradient(180deg, #ffffff 0%, #F5F5F5 100%)',
  },
};

// ============= Typography =============
export const typography = {
  fontFamily: {
    primary: "'Roboto', sans-serif",
    secondary: "'Inter', sans-serif",
    mono: "'Menlo', 'Monaco', 'Courier New', monospace",
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  // Heading sizes (semantic naming)
  sizes: {
    h1: '3rem',         // 48px
    h2: '2.25rem',      // 36px
    h3: '1.875rem',     // 30px
    h4: '1.5rem',       // 24px
    h5: '1.25rem',      // 20px
    h6: '1.125rem',     // 18px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  },

  premiumHeading: "font-display font-black tracking-tighter text-gray-900",
};

// ============= Spacing =============
export const spacing = {
  xs: '0.25rem',      // 4px
  sm: '0.5rem',       // 8px
  md: '1rem',         // 16px
  lg: '1.5rem',       // 24px
  xl: '2rem',         // 32px
  '2xl': '3rem',      // 48px
  '3xl': '4rem',      // 64px
};

// ============= Shadows =============
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  elevation: '0 20px 40px -20px rgba(0, 0, 0, 0.3)',
  premium: '0 20px 60px -20px rgba(253, 73, 96, 0.1)',
};

// ============= Border Radius =============
export const borderRadius = {
  none: '0',
  xs: '0.125rem',     // 2px
  sm: '0.25rem',      // 4px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px
  full: '9999px',
};

// ============= Transitions =============
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============= Component Variants =============
export const componentStyles = {
  button: {
    primary: {
      bg: colors.primary[500],
      text: 'white',
      hover: colors.primary[600],
      active: colors.primary[700],
      disabled: colors.neutral[300],
    },
    secondary: { // rebranded from charcoalSlate
      bg: colors.secondary[500],
      text: 'white',
      hover: colors.secondary[600],
      active: colors.secondary[700],
      disabled: colors.neutral[300],
    },
    outline: {
      bg: 'transparent',
      text: colors.primary[500],
      border: colors.primary[500],
      hover: colors.primary[50],
      disabled: colors.neutral[300],
    },
  },

  input: {
    border: colors.neutral[300],
    focus: colors.primary[500],
    error: colors.status.error,
    disabled: colors.neutral[100],
    placeholder: colors.neutral[400],
  },

  card: {
    bg: 'white',
    border: colors.neutral[200],
    shadow: shadows.md,
    hover: shadows.lg,
  },
};

// ============= Branding =============
export const branding = {
  name: 'Xynema',
  tagline: 'Premium Movie Booking Experience',
  description: 'Book your favorite movies with ease and elegance',

  logo: {
    primary: '/assets/logo.svg',
    white: '/assets/logo-white.svg',
    icon: '/assets/logo-icon.svg',
  },

  social: {
    twitter: 'https://twitter.com/xynema',
    instagram: 'https://instagram.com/xynema',
    facebook: 'https://facebook.com/xynema',
    linkedin: 'https://linkedin.com/company/xynema',
  },

  contact: {
    email: 'support@xynema.com',
    phone: '+1 (800) 123-4567',
    address: '123 Cinema Street, Movie City, MC 12345',
  },

  copyright: '© 2025 Xynema. All rights reserved.',
};

// ============= Accessibility =============
export const a11y = {
  focusOutline: `2px solid ${colors.primary[500]}`,
  focusOutlineOffset: '2px',
  skipLink: {
    clip: 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;',
  },
};

// ============= Responsive Breakpoints =============
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

const designSystem = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  transitions,
  componentStyles,
  branding,
  a11y,
  breakpoints,
};

export { designSystem };
export default designSystem;
