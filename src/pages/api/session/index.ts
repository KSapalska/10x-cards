import type { APIRoute } from "astro";
import { SpacedRepetitionService } from "../../../lib/sr.service";

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const srService = new SpacedRepetitionService(locals.supabase);

  try {
    const flashcards = await srService.getStudySession(session.user.id);
    return new Response(JSON.stringify(flashcards), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Silently handle errors in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("Error getting study session:", error);
    }
    return new Response("Internal Server Error", { status: 500 });
  }
};
