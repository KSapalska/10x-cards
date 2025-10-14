import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto } from "../../types";
import { GenerationService } from "../../lib/generation.service";

export const prerender = false;
// Validation schem
// a for the request body
const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text must not exceed 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as GenerateFlashcardsCommand;
    const validationResult = generateFlashcardsSchema.safeParse(body);

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

    //Temporarty mock response
    /*const mockResponse: GenerationCreateResponseDto = {
      generation_id: 0,
      flashcards_proposals: [],
      generated_count: 0,
    };*/
    const generationService = new GenerationService(locals.supabase);
    const result = await generationService.generateFlashcards(validationResult.data.source_text);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error processing generation request:", error);

    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
