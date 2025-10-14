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
