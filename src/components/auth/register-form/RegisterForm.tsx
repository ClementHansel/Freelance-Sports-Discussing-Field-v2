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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"; // Assuming PasswordStrengthIndicator is a client-side component
import { PasswordValidationResult } from "@/lib/utils/passwordValidation";

export const RegisterForm = () => {
  const router = useRouter(); // Initialize useRouter
  const { signUp, loading } = useAuth();
  const { toast } = useToast();
  const captchaRef = useRef<HCaptchaRef>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidationResult>({
      isValid: false,
      score: 0,
      errors: [],
      suggestions: [],
    });
  const { checkRateLimit, recordAttempt } = useRateLimit("register", {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
  });
  const { siteKey } = useHCaptchaSiteKey();

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
        title: "Too many registration attempts",
        description: `Please wait ${Math.ceil(
          blockTimeRemaining / 60
        )} minutes before trying again.`,
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    // Use comprehensive password validation
    if (!passwordValidation.isValid) {
      toast({
        title: "Password requirements not met",
        description:
          "Please ensure your password meets all security requirements.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.username);
      toast({
        title: "Account created!",
        description: "Welcome to Minor Hockey Talks!",
      });
      router.push("/"); // Use router.push for navigation
    } catch (error) {
      // Record failed attempt
      recordAttempt();

      // Reset CAPTCHA on failed attempt
      captchaRef.current?.resetCaptcha();
      setCaptchaToken("");

      toast({
        title: "Registration failed",
        description: "Please try again with different details.",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login" // Changed 'to' to 'href'
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="mt-1"
                placeholder="Choose a username"
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-1"
                placeholder="Choose a strong password"
              />

              {/* Password Strength Indicator */}
              <div className="mt-2">
                <PasswordStrengthIndicator
                  password={formData.password}
                  onValidationChange={setPasswordValidation}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="mt-1"
                placeholder="Confirm your password"
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
                disabled={
                  loading || !captchaToken || !passwordValidation.isValid
                }
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
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
