"use client";

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 (weak to very strong)
  errors: string[];
  suggestions: string[];
}

export const validatePassword = (
  password: string
): PasswordValidationResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Basic length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else {
    score += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
    suggestions.push("Add lowercase letters (a-z)");
  } else {
    score += 1;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
    suggestions.push("Add uppercase letters (A-Z)");
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
    suggestions.push("Add numbers (0-9)");
  } else {
    score += 1;
  }

  // Check for special characters
  // Removed unnecessary escapes for [ ] and / inside the character class
  if (!/[!@#$%^&*()_+\-={};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
    suggestions.push("Add special characters (!@#$%^&*...)");
  } else {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 1;
  }

  // Check for common weak patterns
  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "abc123",
    "admin",
    "welcome",
    "letmein",
    "monkey",
    "1234567890",
    "password123",
  ];

  if (
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    errors.push("Password contains common words or patterns");
    suggestions.push('Avoid common words like "password" or "123456"');
    score = Math.max(0, score - 2);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password should not contain repeated characters");
    suggestions.push("Avoid repeating the same character multiple times");
    score = Math.max(0, score - 1);
  }

  return {
    isValid: errors.length === 0 && score >= 3,
    score: Math.min(4, score),
    errors,
    suggestions,
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Fair";
    case 4:
      return "Good";
    default:
      return "Very Strong";
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "hsl(var(--destructive))";
    case 2:
      return "hsl(var(--warning))";
    case 3:
      return "hsl(var(--warning))";
    case 4:
      return "hsl(var(--success))";
    default:
      return "hsl(var(--success))";
  }
};
