"use client";

import React, { useState } from "react";
import { CookieConsentBannerImproved } from "./CookieConsentBannerImproved";
import { CookiePreferencesModal } from "./CookiePreferencesModal";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export const CookieConsent: React.FC = () => {
  const {
    consent,
    showBanner,
    acceptAll,
    rejectAll,
    updateConsent,
    hideBanner,
  } = useCookieConsent();

  const [showPreferences, setShowPreferences] = useState(false);

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <CookieConsentBannerImproved
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onShowSettings={() => setShowPreferences(true)}
        onClose={hideBanner}
      />

      <CookiePreferencesModal
        open={showPreferences}
        onOpenChange={setShowPreferences}
        consent={consent}
        onSave={updateConsent}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    </>
  );
};
