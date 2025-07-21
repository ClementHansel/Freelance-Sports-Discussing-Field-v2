"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useVPNDetection } from "@/hooks/useVPNDetection"; // SUSPECT
import { Loader } from "lucide-react";

interface VPNGuardProps {
  children: React.ReactNode;
}

export const VPNGuard = ({ children }: VPNGuardProps) => {
  console.log("🛡️ VPNGuard component mounted");
  const { isBlocked, isLoading } = useVPNDetection();
  const pathname = usePathname();
  const router = useRouter();

  console.log("🛡️ VPNGuard state:", {
    isBlocked,
    isLoading,
    pathname: pathname,
  });

  useEffect(() => {
    // Only redirect if VPN is detected and user is not already on the VPN blocked page
    // useRouter().replace is safe for SSR as it's a Next.js hook, but the condition depends on isBlocked.
    // The useVPNDetection hook is the primary suspect here.
    if (isBlocked && pathname !== "/vpn-blocked") {
      router.replace("/vpn-blocked"); // Use router.replace for 301-like redirect
    }
  }, [isBlocked, pathname, router]); // Updated dependencies for useEffect

  // Show loading spinner while checking VPN status
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

  // If VPN is detected and user is trying to access any page other than VPN blocked page,
  // don't render the children (the redirect will happen via useEffect)
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

  // Render children normally if no VPN detected or if on VPN blocked page
  return <>{children}</>;
};
