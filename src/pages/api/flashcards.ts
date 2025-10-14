import { z } from "zod";
import type { APIRoute } from "astro";
import type { FlashcardsCreateCommand, FlashcardDto } from "../../types";
import { FlashcardService } from "../../lib/flashcard.service";

export const prerender = false;

// Validation schema for individual flashcard
const flashcardCreateSchema = z.object({
  front: z.string().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
  back: z.string().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
  source: z.enum(["ai-full", "ai-edited", "manual"], {
    errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
  }),
  generation_id: z.number().nullable(),
});

// Validation schema for the request body
const flashcardsCreateSchema = z.object({
  flashcards: z
    .array(flashcardCreateSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
});

// Custom validation for generation_id based on source
const validateGenerationIdBySource = (data: z.infer<typeof flashcardCreateSchema>) => {
  if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
    return false;
  }
  if (data.source === "manual" && data.generation_id !== null) {
    return false;
  }
  return true;
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = (await request.json()) as FlashcardsCreateCommand;

    // Basic validation
    const validationResult = flashcardsCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Additional validation for generation_id based on source
    const invalidFlashcards = validationResult.data.flashcards.filter((flashcard, index) => {
      if (!validateGenerationIdBySource(flashcard)) {
        return true;
      }
      return false;
    });

    if (invalidFlashcards.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid generation_id for source type",
          details: "generation_id is required for ai-full and ai-edited sources, and must be null for manual source",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Create flashcards
    const createdFlashcards = await flashcardService.createFlashcards(validationResult.data.flashcards);

    return new Response(
      JSON.stringify({
        flashcards: createdFlashcards,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating flashcards:", error);

    // Handle different types of errors with appropriate status codes
    if (error instanceof Error) {
      // Check for validation errors (generation_id not found)
      if (error.message.includes("Invalid generation_id")) {
        return new Response(
          JSON.stringify({
            error: "Invalid generation reference",
            details: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for database constraint errors
      if (error.message.includes("violates") || error.message.includes("constraint")) {
        return new Response(
          JSON.stringify({
            error: "Data validation error",
            details: "The provided data violates database constraints",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Default to internal server error
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
