import { z } from "zod";
import type { GenerateFlashcardsCommand } from "../types";

/**
 * Validation schema for GenerateFlashcardsCommand
 * Ensures source_text is between 50 and 10000 characters
 */
export const generateFlashcardsCommandSchema = z.object({
  source_text: z
    .string()
    .min(50, "Source text must be at least 150 characters long")
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
