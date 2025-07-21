"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import { HCaptchaComponent, HCaptchaRef } from "@/components/ui/hcaptcha";
import { useHCaptchaSiteKey } from "@/hooks/useHCaptchaSiteKey";

export const LoginForm = () => {
  const router = useRouter(); // Initialize useRouter
  const { signIn, loading } = useAuth();
  const { toast } = useToast();
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const captchaRef = useRef<HCaptchaRef>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const { checkRateLimit, recordAttempt } = useRateLimit("login", {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
  });
  const {
    siteKey,
    isLoading: siteKeyLoading,
    isTestKey,
  } = useHCaptchaSiteKey();

  // Debug logging
  console.log(
    "LoginForm - hCaptcha siteKey:",
    siteKey,
    "isTestKey:",
    isTestKey,
    "loading:",
    siteKeyLoading
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      const blockTimeRemaining = blockedUntil
        ? Math.ceil((blockedUntil - Date.now()) / 1000)
        : 0;

      toast({
        title: "Too many attempts",
        description: `Please wait ${blockTimeRemaining} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate CAPTCHA token
    if (!captchaToken) {
      toast({
        title: "CAPTCHA required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signIn(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      router.push("/"); // Use router.push for navigation
    } catch (error) {
      // Record failed attempt
      recordAttempt();

      // Reset CAPTCHA on failed attempt
      captchaRef.current?.resetCaptcha();
      setCaptchaToken("");

      toast({
        title: "Sign in failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken("");
    toast({
      title: "CAPTCHA error",
      description: "Please try the CAPTCHA again.",
      variant: "destructive",
    });
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
      setShowResetForm(false);
      setResetEmail("");
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/register" // Changed 'to' to 'href'
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-1"
                placeholder="Enter your password"
              />
            </div>

            {/* CAPTCHA */}
            <div>
              <HCaptchaComponent
                ref={captchaRef}
                siteKey={siteKey}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !captchaToken}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {/* Password Reset Modal */}
          {showResetForm && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-4">Reset Password</h3>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail">Email address</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
        <div className="text-center">
          <Link
            href="/" // Changed 'to' to 'href'
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Forum
          </Link>
        </div>
      </div>
    </div>
  );
};
