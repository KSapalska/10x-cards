import type { APIRoute } from "astro";
import { FlashcardService } from "../../../lib/flashcard.service";
import { flashcardIdSchema, flashcardUpdateSchema } from "../../../lib/validation";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // Check authentication - user must be logged in
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized - please log in",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate ID parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          details: idValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Get flashcard by ID
    const flashcard = await flashcardService.getFlashcardById(flashcardId, locals.user.id);

    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching flashcard:", error);

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

export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Check authentication - user must be logged in
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized - please log in",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate ID parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          details: idValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = flashcardUpdateSchema.safeParse(body);

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

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Update flashcard
    const updatedFlashcard = await flashcardService.updateFlashcard(
      flashcardId,
      locals.user.id,
      validationResult.data
    );

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);

    // Handle "not found" error
    if (error instanceof Error && error.message.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

export const DELETE: APIRoute = async ({ params, locals }) => {
  // Check authentication - user must be logged in
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized - please log in",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate ID parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID",
          details: idValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Initialize flashcard service
    const flashcardService = new FlashcardService(locals.supabase);

    // Check if flashcard exists before deleting
    const flashcard = await flashcardService.getFlashcardById(flashcardId, locals.user.id);

    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete flashcard
    await flashcardService.deleteFlashcard(flashcardId, locals.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Flashcard deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting flashcard:", error);

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

