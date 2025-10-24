import type { APIRoute } from "astro";
import { SpacedRepetitionService } from "../../../lib/sr.service";
import type { RateFlashcardDto } from "../../../types";
import * as FSRS from "ts-fsrs";

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { flashcardId, rating } = (await request.json()) as RateFlashcardDto;

    if (!flashcardId || !rating || rating < 1 || rating > 4) {
      return new Response("Invalid input", { status: 400 });
    }

    const srService = new SpacedRepetitionService(locals.supabase);
    const updatedFlashcard = await srService.rateFlashcard(session.user.id, flashcardId, rating as FSRS.Rating);

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error rating flashcard:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return new Response("Flashcard not found", { status: 404 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
};
