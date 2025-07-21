"use client";

import {
  Shield,
  AlertTriangle,
  Loader,
  Smartphone,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useVPNDetection } from "@/hooks/useVPNDetection";
import { Suspense } from "react";

export default function VPNBlocked() {
  const router = useRouter();
  const { isVPN, isLoading, recheckVPN } = useVPNDetection();

  const handleRefresh = async () => {
    await recheckVPN();
    // If VPN is no longer detected, redirect to home
    if (!isVPN) {
      router.push("/"); // Use router.push for programmatic navigation
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading content...</div>
          </Card>
        }
      >
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center justify-center space-x-2 mb-4"
            >
              {" "}
              {/* Changed to href */}
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  MHT
                </span>
              </div>
              <span className="font-bold text-lg text-foreground">
                Minor Hockey Talks
              </span>
            </Link>

            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              VPN/Proxy Traffic Not Allowed
            </CardTitle>
            <CardDescription className="text-center">
              For the safety of our community, VPN and proxy traffic is not
              permitted on this site.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            {/* Apple iCloud Private Relay Warning */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left text-sm">
                <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">
                  Using an Apple device?
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  iCloud Private Relay is detected as a VPN. Please disable it
                  to access the site.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-left text-sm">
                <p className="font-medium mb-1">
                  Please disable VPN/Proxy services
                </p>
                <p className="text-muted-foreground">
                  Turn off any VPN, proxy, or privacy relay services and refresh
                  this page to access the site.
                </p>
              </div>
            </div>

            {/* Instructions Accordion */}
            <Accordion type="single" collapsible className="w-full text-left">
              <AccordionItem value="apple-instructions">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    How to disable iCloud Private Relay
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3">
                  <div>
                    <p className="font-medium text-foreground mb-2">
                      On iPhone/iPad:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open Settings app</li>
                      <li>Tap your name at the top</li>
                      <li>Tap "iCloud"</li>
                      <li>Tap "Private Relay"</li>
                      <li>Turn off "Private Relay"</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">On Mac:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open System Settings</li>
                      <li>Click your name/Apple ID</li>
                      <li>Click "iCloud"</li>
                      <li>Click "Private Relay"</li>
                      <li>Turn off "Private Relay"</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Note: Regular Safari Private Browsing is fine - it's
                    specifically iCloud Private Relay that needs to be disabled.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="other-vpn">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Other VPN/Proxy services
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2">
                  <p>If you're using other services, please disable:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>VPN applications (NordVPN, ExpressVPN, etc.)</li>
                    <li>Proxy servers or browser proxy settings</li>
                    <li>Corporate/school network VPNs</li>
                    <li>Browser privacy extensions that route traffic</li>
                  </ul>
                  <p className="text-xs italic">
                    If you're on a corporate or school network, you may need to
                    use a different connection.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This security measure helps us maintain a safe and trustworthy
                environment for all community members.
              </p>

              <Button
                onClick={handleRefresh}
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  "I've Turned Off My VPN - Check Again"
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact our support
                team.
              </p>
            </div>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}
