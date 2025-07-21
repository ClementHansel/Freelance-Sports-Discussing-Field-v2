"use client";

export type CookieCategory = "essential" | "analytics" | "functional";

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_KEY = "cookie-consent";
const CONSENT_VERSION = "1.0";

export const defaultConsent: CookieConsent = {
  essential: true, // Always true - required for basic functionality
  analytics: true, // Default to true for opt-out model
  functional: false,
  timestamp: Date.now(),
  version: CONSENT_VERSION,
};

export const getCookieConsent = (): CookieConsent | null => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as CookieConsent;

    // Check if consent is outdated (1 year old)
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    if (consent.timestamp < oneYearAgo || consent.version !== CONSENT_VERSION) {
      return null;
    }

    return consent;
  } catch {
    return null;
  }
};

export const setCookieConsent = (consent: Partial<CookieConsent>): void => {
  const fullConsent: CookieConsent = {
    ...defaultConsent,
    ...consent,
    essential: true, // Always true
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));

  // Dispatch custom event for other components to listen
  window.dispatchEvent(
    new CustomEvent("cookieConsentChange", {
      detail: fullConsent,
    })
  );
};

export const clearCookieConsent = (): void => {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(
    new CustomEvent("cookieConsentChange", {
      detail: null,
    })
  );
};

export const hasConsent = (category: CookieCategory): boolean => {
  const consent = getCookieConsent() || defaultConsent;
  return consent[category];
};

export const acceptAllCookies = (): void => {
  setCookieConsent({
    analytics: true,
    functional: true,
  });
};

export const rejectNonEssentialCookies = (): void => {
  setCookieConsent({
    analytics: false,
    functional: false,
  });
};
