"use client";

import { useState, useEffect } from "react";
import {
  CookieConsent,
  CookieCategory,
  getCookieConsent,
  setCookieConsent,
  hasConsent,
  acceptAllCookies,
  rejectNonEssentialCookies,
  defaultConsent,
} from "@/lib/utils/cookieConsent";

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(
    getCookieConsent() || defaultConsent
  );
  const [showBanner, setShowBanner] = useState(!getCookieConsent());

  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      setConsent(event.detail);
      setShowBanner(!event.detail);
    };

    window.addEventListener(
      "cookieConsentChange",
      handleConsentChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "cookieConsentChange",
        handleConsentChange as EventListener
      );
    };
  }, []);

  const updateConsent = (updates: Partial<CookieConsent>) => {
    setCookieConsent(updates);
  };

  const acceptAll = () => {
    acceptAllCookies();
  };

  const rejectAll = () => {
    rejectNonEssentialCookies();
  };

  const hasCategory = (category: CookieCategory) => {
    return hasConsent(category);
  };

  return {
    consent,
    showBanner,
    hasConsent: hasCategory,
    updateConsent,
    acceptAll,
    rejectAll,
    hideBanner: () => setShowBanner(false),
  };
};
