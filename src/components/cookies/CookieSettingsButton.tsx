import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface CookieSettingsButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const CookieSettingsButton: React.FC<CookieSettingsButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className,
}) => {
  const [showModal, setShowModal] = useState(false);
  const { consent, acceptAll, rejectAll, updateConsent } = useCookieConsent();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={className}
      >
        <Settings className="h-4 w-4 mr-2" />
        Cookie Preferences
      </Button>

      <CookiePreferencesModal
        open={showModal}
        onOpenChange={setShowModal}
        consent={consent}
        onSave={updateConsent}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
      />
    </>
  );
};