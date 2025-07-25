"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { usePathname, useRouter } from "next/navigation";
import { useVPNDetection } from "@/hooks/useVPNDetection";
import { Loader } from "lucide-react";

interface VPNGuardProps {
  children: React.ReactNode;
}

export const VPNGuard = ({ children }: VPNGuardProps) => {
  const { isBlocked, isLoading } = useVPNDetection();
  const pathname = usePathname();
  const router = useRouter();

  // Set Sentry tag/context once mounted
  useEffect(() => {
    Sentry.setTag("page", "vpn_guard");
    Sentry.setContext("vpn", {
      path: pathname,
      vpnBlocked: isBlocked,
      loading: isLoading,
    });

    if (isBlocked && pathname !== "/vpn-blocked") {
      Sentry.captureMessage(
        "VPN access blocked - redirecting to /vpn-blocked",
        "info"
      );
      router.replace("/vpn-blocked");
    }
  }, [isBlocked, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking connection...
          </p>
        </div>
      </div>
    );
  }

  if (isBlocked && pathname !== "/vpn-blocked") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
