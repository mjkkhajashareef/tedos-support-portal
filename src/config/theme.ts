/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
}

export interface DesignTokens {
  colors: ThemeColors;
  fonts: {
    sans: string;
    mono: string;
    display: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  radius: {
    none: string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    none: string;
    flat: string;
    raised: string;
    overlay: string;
  };
  transitions: {
    fast: string;
    medium: string;
    slow: string;
    bounce: string;
  };
}

// Light Theme Tokens
export const LIGHT_THEME: DesignTokens = {
  colors: {
    primary: '#0F52BA', // Sapphire Blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#D7E2FF',
    onPrimaryContainer: '#001A49',
    secondary: '#3C6478',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#C0E8FF',
    background: '#FAFAFC', // Crisp Off-White
    onBackground: '#1C1B1F', // Deep Charcoal
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E1E2EC',
    onSurfaceVariant: '#44464F',
    outline: '#757780',
    outlineVariant: '#C5C6D0',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    success: '#138048',
    onSuccess: '#FFFFFF',
    warning: '#D07A00',
    onWarning: '#FFFFFF',
    surfaceContainerLow: '#F4F3F7',
    surfaceContainer: '#EDEDF1',
    surfaceContainerHigh: '#E7E6EB',
  },
  fonts: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    display: '"Space Grotesk", sans-serif',
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    xxl: '3rem',   // 48px
  },
  radius: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    flat: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    raised: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    overlay: '0px 8px 32px rgba(0, 0, 0, 0.12)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// Dark Theme Tokens (OLED optimized high contrast option)
export const DARK_THEME: DesignTokens = {
  colors: {
    primary: '#ADC6FF', // Pale Blue Accent
    onPrimary: '#002E69',
    primaryContainer: '#004494',
    onPrimaryContainer: '#D7E2FF',
    secondary: '#A5CDFF',
    onSecondary: '#003258',
    secondaryContainer: '#00497D',
    background: '#0F0F11', // Very dark Charcoal-Black
    onBackground: '#E3E2E6', // Slate-Silver
    surface: '#151518',
    onSurface: '#E3E2E6',
    surfaceVariant: '#44464F',
    onSurfaceVariant: '#C5C6D0',
    outline: '#8F9099',
    outlineVariant: '#44464F',
    error: '#FFB4AB',
    onError: '#690005',
    success: '#69DB93',
    onSuccess: '#00391E',
    warning: '#FFB85F',
    onWarning: '#4D2A00',
    surfaceContainerLow: '#1A1A1E',
    surfaceContainer: '#202025',
    surfaceContainerHigh: '#28282D',
  },
  fonts: LIGHT_THEME.fonts,
  spacing: LIGHT_THEME.spacing,
  radius: LIGHT_THEME.radius,
  shadows: {
    none: 'none',
    flat: '0px 1px 2px rgba(0, 0, 0, 0.3)',
    raised: '0px 4px 16px rgba(0, 0, 0, 0.4)',
    overlay: '0px 8px 32px rgba(0, 0, 0, 0.5)',
  },
  transitions: LIGHT_THEME.transitions,
};

// Corporate Brand Preset Theme (Future Brand)
export const SAPPHIRE_ELEGANCE_THEME: DesignTokens = {
  ...LIGHT_THEME,
  colors: {
    ...LIGHT_THEME.colors,
    primary: '#0047AB', // Royal Cobalt
    secondary: '#1C3B5E',
    background: '#F0F4F8',
    surface: '#FFFFFF',
    surfaceContainer: '#E1EAF2',
  },
};

export type ThemeType = 'light' | 'dark' | 'sapphire';

export const THEME_REGISTRY: Record<ThemeType, DesignTokens> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  sapphire: SAPPHIRE_ELEGANCE_THEME,
};

/**
 * Enterprise Theme Injector
 * Dynamically binds our centralized design system tokens directly to CSS
 * custom properties on the DOM root element. This allows Tailwind CSS v4 classes
 * to automatically adapt to dynamic theme swaps.
 */
export const applyThemeToDOM = (theme: DesignTokens) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  // Inject theme-specific colors
  Object.entries(theme.colors).forEach(([key, val]) => {
    // CamelCase to kebab-case (e.g. primaryContainer -> primary-container)
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--color-md-${cssKey}`, val);
  });

  // Inject font families
  Object.entries(theme.fonts).forEach(([key, val]) => {
    root.style.setProperty(`--font-${key}`, val);
  });

  // Inject responsive spacing tokens
  Object.entries(theme.spacing).forEach(([key, val]) => {
    root.style.setProperty(`--spacing-${key}`, val);
  });

  // Inject structural radii tokens
  Object.entries(theme.radius).forEach(([key, val]) => {
    root.style.setProperty(`--radius-${key}`, val);
  });

  // Inject depth elevation shadows
  Object.entries(theme.shadows).forEach(([key, val]) => {
    root.style.setProperty(`--shadow-${key}`, val);
  });

  // Inject timing transitions
  Object.entries(theme.transitions).forEach(([key, val]) => {
    root.style.setProperty(`--transition-${key}`, val);
  });
};

