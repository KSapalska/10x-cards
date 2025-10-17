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
 * Password validation schema
 * Minimum 6 characters (Supabase default)
 */
export const passwordSchema = z
  .string()
  .min(1, "Hasło jest wymagane")
  .min(6, "Hasło musi zawierać co najmniej 6 znaków");

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
 * Logout request validation schema (no body required, but can validate headers)
 */
export const logoutSchema = z.object({}).optional();

export type LogoutCommand = z.infer<typeof logoutSchema>;
