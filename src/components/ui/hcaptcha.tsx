"use client";

import React, { useRef, forwardRef, useImperativeHandle } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  siteKey?: string;
}

export interface HCaptchaRef {
  resetCaptcha: () => void;
}

const HCaptchaComponent = forwardRef<HCaptchaRef, HCaptchaComponentProps>(
  (
    { onVerify, onError, siteKey = "10000000-ffff-ffff-ffff-000000000001" },
    ref
  ) => {
    const captchaRef = useRef<HCaptcha>(null);

    useImperativeHandle(ref, () => ({
      resetCaptcha: () => {
        captchaRef.current?.resetCaptcha();
      },
    }));

    return (
      <div className="flex justify-center">
        <HCaptcha
          ref={captchaRef}
          sitekey={siteKey}
          onVerify={onVerify}
          onError={onError}
          onExpire={() => onError?.()}
        />
      </div>
    );
  }
);

HCaptchaComponent.displayName = "HCaptchaComponent";

export { HCaptchaComponent };
