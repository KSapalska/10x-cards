import { z } from "zod";
import type { GenerateFlashcardsCommand } from "../types";

/**
 * Validation schema for GenerateFlashcardsCommand
 * Ensures source_text is between 1000 and 10000 characters (aligned with API and DB)
 */
export const generateFlashcardsCommandSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters long")
    .max(10000, "Source text must not exceed 10000 characters")
    .trim(),
}) satisfies z.ZodType<GenerateFlashcardsCommand>;

export type ValidatedGenerateFlashcardsCommand = z.infer<typeof generateFlashcardsCommandSchema>;

// ------------------------------------------------------------------------------------------------
// Authentication Validation Schemas
// ------------------------------------------------------------------------------------------------

/**
 * Email validation schema (RFC 5322 compliant)
 */
export const emailSchema = z
  .string()
  .min(1, "Adres email jest wymagany")
  .email("Nieprawidłowy format adresu email")
  .trim()
  .toLowerCase();

/**
 * Password validation schema for login
 * Minimum 6 characters (Supabase default)
 */
export const passwordSchema = z
  .string()
  .min(1, "Hasło jest wymagane")
  .min(6, "Hasło musi zawierać co najmniej 6 znaków");

/**
 * Strong password validation schema for registration
 * Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
 */
export const strongPasswordSchema = z
  .string()
  .min(1, "Hasło jest wymagane")
  .min(8, "Hasło musi zawierać co najmniej 8 znaków")
  .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Hasło musi zawierać co najmniej jeden znak specjalny"
  );

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false),
});

export type LoginCommand = z.infer<typeof loginSchema>;

/**
 * Register request validation schema
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterCommand = z.infer<typeof registerSchema>;

/**
 * Logout request validation schema (no body required, but can validate headers)
 */
export const logoutSchema = z.object({}).optional();

export type LogoutCommand = z.infer<typeof logoutSchema>;

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordCommand = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request validation schema
 * Note: Token is handled by Supabase automatically via URL params
 */
export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordCommand = z.infer<typeof resetPasswordSchema>;

// ------------------------------------------------------------------------------------------------
// Flashcard Validation Functions
// ------------------------------------------------------------------------------------------------

/**
 * Maximum character limits for flashcard fields
 */
export const FLASHCARD_LIMITS = {
  FRONT_MAX_LENGTH: 200,
  BACK_MAX_LENGTH: 500,
} as const;

/**
 * Validates flashcard front and back content
 * Returns error message if invalid, null if valid
 */
export function validateFlashcard(front: string, back: string): string | null {
  // Check if front is empty (after trimming)
  if (front.trim().length === 0) {
    return "Przód fiszki nie może być pusty";
  }

  // Check if back is empty (after trimming)
  if (back.trim().length === 0) {
    return "Tył fiszki nie może być pusty";
  }

  // Check front max length
  if (front.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH) {
    return `Przód fiszki może mieć maksymalnie ${FLASHCARD_LIMITS.FRONT_MAX_LENGTH} znaków`;
  }

  // Check back max length
  if (back.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH) {
    return `Tył fiszki może mieć maksymalnie ${FLASHCARD_LIMITS.BACK_MAX_LENGTH} znaków`;
  }

  return null;
}

// ------------------------------------------------------------------------------------------------
// Text Input Area Validation Functions
// ------------------------------------------------------------------------------------------------

/**
 * Character limits for source text input
 */
export const TEXT_INPUT_LIMITS = {
  MIN_LENGTH: 1000,
  MAX_LENGTH: 10000,
} as const;

/**
 * Determines the color state for character counter in TextInputArea
 * @param textLength - Current text length
 * @returns Color state string for Tailwind classes
 */
export function getCounterColorState(textLength: number): "default" | "warning" | "error" | "success" {
  if (textLength === 0) {
    return "default";
  }

  if (textLength < TEXT_INPUT_LIMITS.MIN_LENGTH) {
    return "warning"; // Too short (orange)
  }

  if (textLength > TEXT_INPUT_LIMITS.MAX_LENGTH) {
    return "error"; // Too long (red/destructive)
  }

  return "success"; // Valid range (green)
}

/**
 * Maps color state to Tailwind CSS classes
 */
export function getCounterColorClass(textLength: number): string {
  const state = getCounterColorState(textLength);

  switch (state) {
    case "default":
      return "text-muted-foreground";
    case "warning":
      return "text-orange-600 dark:text-orange-400";
    case "error":
      return "text-destructive";
    case "success":
      return "text-green-600 dark:text-green-400";
  }
}
