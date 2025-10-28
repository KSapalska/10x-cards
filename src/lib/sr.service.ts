import type { SupabaseClient } from "../db/supabase.client";
import type { Database } from "../db/database.types";
import * as FSRS from "ts-fsrs";

type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
type Card = FSRS.Card;
type State = FSRS.State;
type Rating = FSRS.Rating;

export class SpacedRepetitionService {
  private supabase: SupabaseClient;
  private fsrs = FSRS.fsrs(FSRS.default_params);

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Retrieves the flashcards due for a study session for a given user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of flashcards due for review.
   */
  public async getStudySession(userId: string): Promise<Flashcard[]> {
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .lte("due", new Date().toISOString())
      .order("due", { ascending: true });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching study session:", error);
      throw new Error("Could not retrieve study session flashcards.");
    }

    // TODO: Add randomization or other sorting logic if needed
    return flashcards || [];
  }

  /**
   * Rates a flashcard, updates its spaced repetition data, and records the review.
   * @param userId - The ID of the user.
   * @param flashcardId - The ID of the flashcard to rate.
   * @param rating - The user's rating for the flashcard (1-4).
   * @returns A promise that resolves to the updated flashcard.
   */
  public async rateFlashcard(userId: string, flashcardId: number, rating: Rating): Promise<Flashcard> {
    const { data: flashcard, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !flashcard) {
      // eslint-disable-next-line no-console
      console.error("Error fetching flashcard to rate:", fetchError);
      throw new Error("Flashcard not found or user does not have access.");
    }

    const card: Card = this.mapFlashcardToFsrsCard(flashcard);
    const stateBefore = card.state;

    const schedulingResult = this.fsrs.repeat(card, new Date());
    const newCardState = schedulingResult[rating];
    const stateAfter = newCardState.card.state;

    // Use a transaction to update the flashcard and insert the review
    const { data: updatedFlashcard, error: transactionError } = await this.supabase.rpc(
      "rate_flashcard_and_log_review",
      {
        p_flashcard_id: flashcardId,
        p_user_id: userId,
        p_rating: rating,
        p_state_before: FSRS.State[stateBefore],
        p_state_after: FSRS.State[stateAfter],
        p_due: newCardState.card.due.toISOString(),
        p_stability: newCardState.card.stability,
        p_difficulty: newCardState.card.difficulty,
        p_elapsed_days: newCardState.card.elapsed_days,
        p_scheduled_days: newCardState.card.scheduled_days,
        p_reps: newCardState.card.reps,
        p_lapses: newCardState.card.lapses,
        p_state: FSRS.State[newCardState.card.state],
        p_last_review: newCardState.card.last_review.toISOString(),
      }
    );

    if (transactionError) {
      // eslint-disable-next-line no-console
      console.error("Error in rate_flashcard_and_log_review RPC:", transactionError);
      throw new Error("Failed to update flashcard and log review.");
    }

    return updatedFlashcard[0];
  }

  /**
   * Maps a flashcard from the database to a FSRS Card object.
   * @param flashcard - The flashcard data from Supabase.
   * @returns A FSRS Card object.
   */
  private mapFlashcardToFsrsCard(flashcard: Flashcard): Card {
    return {
      due: new Date(flashcard.due),
      stability: flashcard.stability ?? 0,
      difficulty: flashcard.difficulty ?? 0,
      elapsed_days: flashcard.elapsed_days ?? 0,
      scheduled_days: flashcard.scheduled_days ?? 0,
      reps: flashcard.reps ?? 0,
      lapses: flashcard.lapses ?? 0,
      state: (flashcard.state as State) ?? FSRS.State.New,
      last_review: flashcard.last_review ? new Date(flashcard.last_review) : new Date(flashcard.created_at),
    };
  }
}
