/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TEDOS Support Brand Asset Configuration
 * Single Source of Truth for Enterprise Visual Identity.
 * Decouples code from static asset files. Official branding files can be
 * dropped into assets or linked directly without changing application logic.
 */
export interface BrandAssetConfig {
  companyName: string;
  brandTagline: string;
  logos: {
    lightTheme: string; // Used on light background headers
    darkTheme: string;  // Used on dark backgrounds or dark mode
    loginScreen: string; // Displayed on the secure login screen
    splashScreen: string; // Shown during initial application loading
    favicon: string; // Tab icon reference
  };
  icons: {
    appIcon: string;     // Primary 512x512 app icon
    pwaMaskable: string; // PWA compliant maskable icon
    pwaFavicon: string;  // Multi-resolution favicon
  };
  meta: {
    copyrightHolder: string;
    poweredByText: string;
  };
}

export const TEDOS_BRAND_ASSETS: BrandAssetConfig = {
  companyName: 'Techno Evident',
  brandTagline: 'Digital Operating System',
  logos: {
    // Relative paths to the public assets directory.
    // If the files are not present, components default to SVG fallback icons.
    lightTheme: '/assets/brand/logo-light.svg',
    darkTheme: '/assets/brand/logo-dark.svg',
    loginScreen: '/assets/brand/logo-login.svg',
    splashScreen: '/assets/brand/logo-splash.svg',
    favicon: '/favicon.ico',
  },
  icons: {
    appIcon: '/assets/brand/app-icon-512.png',
    pwaMaskable: '/assets/brand/app-icon-maskable.png',
    pwaFavicon: '/assets/brand/favicon-32x32.png',
  },
  meta: {
    copyrightHolder: 'Techno Evident Pvt. Ltd.',
    poweredByText: 'Powered by TEDOS Secure Core Framework',
  },
};
