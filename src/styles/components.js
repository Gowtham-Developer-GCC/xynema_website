/**
 * Premium UI Component Styles & Utilities
 * Professional, Modern, Accessible Components
 */

import designSystem from '../config/design-system';

/**
 * Button Component Variants
 */
export const buttonStyles = {
  base: `
    inline-flex items-center justify-center
    font-${designSystem.typography.fontWeight.medium}
    transition-all ${designSystem.transitions.base}
    cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
    rounded-${designSystem.borderRadius.lg}
  `,

  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-3.5 text-xl',
  },

  variant: {
    primary: `
      bg-gradient-to-r from-[#FD4960] to-[#E33D52]
      text-white
      hover:from-[#E33D52] hover:to-[#FD4960]
      shadow-md hover:shadow-lg
      focus:ring-[#FD4960]
    `,
    secondary: `
      bg-gradient-to-r from-[#81a4cd] to-[#FD4960]
      text-white
      hover:from-[#6b8eaa] hover:to-[#E33D52]
      shadow-md hover:shadow-lg
      focus:ring-[#81a4cd]
    `,
    outline: `
      border-2 border-[#FD4960]
      text-[#FD4960]
      hover:bg-[#fff1f2]
      focus:ring-[#FD4960]
    `,
    ghost: `
      text-[#FD4960]
      hover:bg-[#fff1f2]
      focus:ring-[#FD4960]
    `,
  },
};

/**
 * Input Component Styles
 */
export const inputStyles = {
  base: `
    w-full px-4 py-2.5
    border border-gray-300
    rounded-lg
    font-${designSystem.typography.fontWeight.normal}
    transition-all ${designSystem.transitions.base}
    focus:outline-none focus:border-[#FD4960] focus:ring-2 focus:ring-[#fff1f2]
    disabled:bg-gray-100 disabled:cursor-not-allowed
    placeholder:text-gray-400
  `,

  error: `
    border-red-500
    focus:border-red-500 focus:ring-red-100
  `,

  success: `
    border-green-500
    focus:border-green-500 focus:ring-green-100
  `,
};

/**
 * Card Component Styles
 */
export const cardStyles = {
  base: `
    bg-white
    border border-gray-200
    rounded-xl
    overflow-hidden
    transition-all ${designSystem.transitions.base}
    shadow-sm hover:shadow-lg
  `,

  padding: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },

  variant: {
    elevated: `
      shadow-lg
      border-0
    `,
    outlined: `
      border-2 border-gray-200
    `,
    filled: `
      bg-gray-50
      border-0
    `,
  },
};

/**
 * Badge Component Styles
 */
export const badgeStyles = {
  base: `
    inline-flex items-center
    px-2.5 py-0.5
    rounded-full
    text-xs font-${designSystem.typography.fontWeight.semibold}
    transition-colors ${designSystem.transitions.fast}
  `,

  variant: {
    primary: 'bg-[#fff1f2] text-[#FD4960]',
    secondary: 'bg-[#f5f0f9] text-[#81a4cd]',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-[#fff1f2] text-[#FD4960]', // High contrast brand color for errors
  },
};

/**
 * Modal Component Styles
 */
export const modalStyles = {
  overlay: `
    fixed inset-0
    bg-black bg-opacity-50
    flex items-center justify-center
    z-50
    p-4
    animation: fadeIn ${designSystem.transitions.base}
  `,

  content: `
    bg-white
    rounded-xl
    shadow-2xl
    max-w-lg w-full
    max-h-[90vh]
    overflow-y-auto
    animation: slideUp ${designSystem.transitions.base}
  `,
};

/**
 * Typography Styles
 */
export const typographyStyles = {
  h1: `
    text-4xl font-${designSystem.typography.fontWeight.bold}
    leading-${designSystem.typography.lineHeight.tight}
    tracking-${designSystem.typography.letterSpacing.tight}
  `,
  h2: `
    text-3xl font-${designSystem.typography.fontWeight.bold}
    leading-${designSystem.typography.lineHeight.tight}
  `,
  h3: `
    text-2xl font-${designSystem.typography.fontWeight.semibold}
    leading-${designSystem.typography.lineHeight.normal}
  `,
  h4: `
    text-xl font-${designSystem.typography.fontWeight.semibold}
    leading-${designSystem.typography.lineHeight.normal}
  `,
  body: `
    text-base font-${designSystem.typography.fontWeight.normal}
    leading-${designSystem.typography.lineHeight.relaxed}
    text-gray-700
  `,
  caption: `
    text-sm font-${designSystem.typography.fontWeight.normal}
    leading-${designSystem.typography.lineHeight.normal}
    text-gray-500
  `,
};

/**
 * Responsive Grid Utilities
 */
export const gridStyles = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',

  grid: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    },
    gap: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
};

/**
 * Animation Utilities
 */
export const animationStyles = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    animation: fadeIn ${designSystem.transitions.base};
  `,

  slideUp: `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    animation: slideUp ${designSystem.transitions.base};
  `,

  slideDown: `
    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    animation: slideDown ${designSystem.transitions.base};
  `,

  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    animation: scaleIn ${designSystem.transitions.base};
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  `,

  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    animation: spin 1s linear infinite;
  `,
};

/**
 * Loading States
 */
export const loadingStates = {
  skeleton: `
    bg-gray-200 animate-pulse
    rounded-lg
  `,

  spinner: `
    inline-block h-8 w-8 animate-spin
    rounded-full border-4 border-gray-300
    border-t-[#FD4960]
  `,

  shimmer: `
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  `,
};

/**
 * Accessibility Features
 */
export const a11yStyles = {
  focusRing: `
    focus:outline-none focus:ring-2 focus:ring-[#FD4960] focus:ring-offset-2
    focus:rounded-lg
  `,

  visuallyHidden: `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  `,

  skipLink: `
    ${designSystem.a11y.skipLink.clip}
    focus:clip-auto focus:absolute focus:top-0 focus:left-0
    focus:z-50 focus:p-2 focus:bg-[#FD4960] focus:text-white
  `,
};

/**
 * Utility function to combine styles
 */
export const combineStyles = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate responsive classes
 */
export const responsive = (mobileClass, tabletClass = '', desktopClass = '') => {
  return [
    mobileClass,
    `sm:${tabletClass || mobileClass}`,
    `lg:${desktopClass || tabletClass || mobileClass}`,
  ].join(' ');
};

export default {
  buttonStyles,
  inputStyles,
  cardStyles,
  badgeStyles,
  modalStyles,
  typographyStyles,
  gridStyles,
  animationStyles,
  loadingStates,
  a11yStyles,
  combineStyles,
  responsive,
};
