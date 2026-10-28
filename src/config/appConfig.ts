/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxhbrnIQMIFHpZGXxq2Q2xnPJLPQtnCpDbDXFIOBPeWo6vulj2jEiWWrVlonr6dHa_M/exec';
// Client Information, Billing & Usage dedicated script URL (isolated from Ultimate Sheet)
export const GOOGLE_APPS_SCRIPT_CLIENT_USAGE_BILLING_URL = 'https://script.google.com/macros/s/AKfycbwnTipPI0OqpJdmgJa5q7ZgPit0jyIVvxFamdbC8pTVpYslchy2vfoOYdD_Po-8QsAE/exec';

export interface AppConfiguration {
  envName: 'development' | 'testing' | 'production';
  apiEndpoint: string;
  app: {
    name: string;
    shortName: string;
    version: string;
    buildNumber: string;
    supportEmail: string;
    supportPhone: string;
    website: string;
    helpdeskUrl: string;
  };
  localization: {
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: {
      code: string;
      symbol: string;
      locale: string;
    };
  };
  api: {
    baseUrl: string;
    apiEndpoint: string;
    timeoutMs: number;
    sheetSyncEndpoint: string;
    whatsappEndpoint: string;
    telemetryEndpoint: string;
  };
  ai: {
    modelName: string;
    maxTokens: number;
    temperature: number;
    systemPromptPrefix: string;
    insightsCacheDurationMs: number;
  };
  whatsapp: {
    sandboxMode: boolean;
    retryLimit: number;
    defaultCountryCode: string;
    outboxPollingMs: number;
  };
  security: {
    tokenExpirationMin: number;
    passwordMinLength: number;
    requireMultiFactor: boolean;
    enableActivityAudit: boolean;
  };
}

// ----------------------------------------------------
// DEVELOPMENT ENVIRONMENT CONFIGURATION
// ----------------------------------------------------
export const DEV_CONFIG: AppConfiguration = {
  envName: 'development',
  apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
  app: {
    name: 'TEDOS Support Intelligence (Dev Workspace)',
    shortName: 'TEDOS Support Dev',
    version: '1.0.0-dev',
    buildNumber: 'B2026.07.08-1',
    supportEmail: 'dev-support@technoevident.com',
    supportPhone: '+91 99999 88888',
    website: 'https://dev.technoevident.com',
    helpdeskUrl: 'https://dev.technoevident.com/help',
  },
  localization: {
    defaultLanguage: 'en-US',
    timezone: 'Asia/Kolkata',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm:ss',
    currency: {
      code: 'INR',
      symbol: '₹',
      locale: 'en-IN',
    },
  },
  api: {
    baseUrl: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    timeoutMs: 15000,
    sheetSyncEndpoint: '/sync/sheets',
    whatsappEndpoint: '/broadcast/whatsapp',
    telemetryEndpoint: '/metrics/telemetry',
  },
  ai: {
    modelName: 'gemini-2.5-flash',
    maxTokens: 1024,
    temperature: 0.2,
    systemPromptPrefix: 'DEV_MODE: Act as the development telemetry advisor for TEDOS Support.',
    insightsCacheDurationMs: 60000, // 1 minute cache in dev
  },
  whatsapp: {
    sandboxMode: true,
    retryLimit: 1,
    defaultCountryCode: '+91',
    outboxPollingMs: 5000,
  },
  security: {
    tokenExpirationMin: 1440, // 24 hours for easier development session persistence
    passwordMinLength: 6,
    requireMultiFactor: false,
    enableActivityAudit: true,
  },
};

// ----------------------------------------------------
// TESTING (QA / STAGING) ENVIRONMENT CONFIGURATION
// ----------------------------------------------------
export const TEST_CONFIG: AppConfiguration = {
  envName: 'testing',
  apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
  app: {
    name: 'TEDOS Support (QA / Test Environment)',
    shortName: 'TEDOS Support QA',
    version: '1.0.0-rc1',
    buildNumber: 'B2026.07.08-RC',
    supportEmail: 'qa-support@technoevident.com',
    supportPhone: '+91 98888 77777',
    website: 'https://qa.technoevident.com',
    helpdeskUrl: 'https://qa.technoevident.com/help',
  },
  localization: {
    defaultLanguage: 'en-US',
    timezone: 'Asia/Kolkata',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm:ss',
    currency: {
      code: 'INR',
      symbol: '₹',
      locale: 'en-IN',
    },
  },
  api: {
    baseUrl: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    timeoutMs: 15000,
    sheetSyncEndpoint: '/sync/sheets',
    whatsappEndpoint: '/broadcast/whatsapp',
    telemetryEndpoint: '/metrics/telemetry',
  },
  ai: {
    modelName: 'gemini-2.5-flash',
    maxTokens: 2048,
    temperature: 0.1,
    systemPromptPrefix: 'QA_MODE: Validate all sheet columns strictly against telemetry blueprints.',
    insightsCacheDurationMs: 300000, // 5 minutes
  },
  whatsapp: {
    sandboxMode: true,
    retryLimit: 3,
    defaultCountryCode: '+91',
    outboxPollingMs: 10000,
  },
  security: {
    tokenExpirationMin: 120, // 2 hours
    passwordMinLength: 8,
    requireMultiFactor: true,
    enableActivityAudit: true,
  },
};

// ----------------------------------------------------
// PRODUCTION ENVIRONMENT CONFIGURATION
// ----------------------------------------------------
export const PROD_CONFIG: AppConfiguration = {
  envName: 'production',
  apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
  app: {
    name: 'TEDOS Support Digital Operating System',
    shortName: 'TEDOS Support',
    version: '1.0.0',
    buildNumber: 'B2026.07.08-RELEASE',
    supportEmail: 'support@technoevident.com',
    supportPhone: '+91 90000 11111',
    website: 'https://support.technoevident.com',
    helpdeskUrl: 'https://support.technoevident.com/help',
  },
  localization: {
    defaultLanguage: 'en-US',
    timezone: 'Asia/Kolkata',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'HH:mm:ss',
    currency: {
      code: 'INR',
      symbol: '₹',
      locale: 'en-IN',
    },
  },
  api: {
    baseUrl: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    timeoutMs: 15000,
    sheetSyncEndpoint: '/sync/sheets',
    whatsappEndpoint: '/broadcast/whatsapp',
    telemetryEndpoint: '/metrics/telemetry',
  },
  ai: {
    modelName: 'gemini-2.5-flash',
    maxTokens: 4096,
    temperature: 0.0, // Strict, highly accurate responses
    systemPromptPrefix: 'PRODUCTION: Act as the chief enterprise system architect for TEDOS Support.',
    insightsCacheDurationMs: 1800000, // 30 minutes
  },
  whatsapp: {
    sandboxMode: false,
    retryLimit: 5,
    defaultCountryCode: '+91',
    outboxPollingMs: 30000,
  },
  security: {
    tokenExpirationMin: 60, // 1 hour secure expiration
    passwordMinLength: 10,
    requireMultiFactor: true,
    enableActivityAudit: true,
  },
};

/**
 * Global Active Environment Selector
 * Can be overwritten at runtime, via dotenv variables, or localStorage override.
 */
const getActiveEnvironment = (): 'development' | 'testing' | 'production' => {
  // If a manual override exists in local storage (useful for testers toggling envs in a single bundle), use it
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('TEDOS_ENV_OVERRIDE');
    if (override === 'development' || override === 'testing' || override === 'production') {
      return override;
    }
  }

  // Fallback to Vite dynamic import mode
  // @ts-ignore
  const mode = (import.meta as any).env?.MODE;
  if (mode === 'production') return 'production';
  if (mode === 'test' || mode === 'staging') return 'testing';
  return 'development'; // Default environment
};

export const ACTIVE_ENV = getActiveEnvironment();

export const ACTIVE_CONFIG: AppConfiguration = 
  ACTIVE_ENV === 'production' ? PROD_CONFIG :
  ACTIVE_ENV === 'testing' ? TEST_CONFIG : DEV_CONFIG;

export const CONFIG = {
  ...ACTIVE_CONFIG,
  apiEndpoint: GOOGLE_APPS_SCRIPT_WEB_APP_URL,
};

/**
 * Utility to manually switch environments on the client during validation
 */
export const switchEnvironmentOverride = (env: 'development' | 'testing' | 'production' | 'clear') => {
  if (typeof window === 'undefined') return;
  if (env === 'clear') {
    localStorage.removeItem('TEDOS_ENV_OVERRIDE');
  } else {
    localStorage.setItem('TEDOS_ENV_OVERRIDE', env);
  }
  window.location.reload();
};
