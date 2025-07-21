"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
  PasswordValidationResult,
} from "@/lib/utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (result: PasswordValidationResult) => void;
}

export const PasswordStrengthIndicator: React.FC<
  PasswordStrengthIndicatorProps
> = ({ password, onValidationChange }) => {
  const validation = validatePassword(password);

  React.useEffect(() => {
    onValidationChange?.(validation);
  }, [validation, onValidationChange]);

  if (!password) return null;

  const progressValue = (validation.score / 4) * 100;
  const strengthColor = getPasswordStrengthColor(validation.score);
  const strengthLabel = getPasswordStrengthLabel(validation.score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength:</span>
        <span className="font-medium" style={{ color: strengthColor }}>
          {strengthLabel}
        </span>
      </div>

      <Progress
        value={progressValue}
        className="h-2"
        style={
          {
            "--progress-background": strengthColor,
          } as React.CSSProperties
        }
      />

      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-xs text-destructive">
              • {error}
            </p>
          ))}
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            Suggestions:
          </p>
          {validation.suggestions.map((suggestion, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              • {suggestion}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
