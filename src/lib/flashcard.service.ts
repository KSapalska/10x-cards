import type {
  FlashcardCreateDto,
  FlashcardDto,
  FlashcardsListResponseDto,
  FlashcardUpdateDto,
  Source,
} from "../types";
import type { SupabaseClient } from "../db/supabase.client";

export class FlashcardService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates multiple flashcards in a single batch operation
   * @param flashcardsData Array of flashcard data to create
   * @param userId User ID from authenticated session
   * @returns Array of created flashcards
   */
  async createFlashcards(flashcardsData: FlashcardCreateDto[], userId: string): Promise<FlashcardDto[]> {
    try {
      // Validate generation_ids exist if provided
      await this.validateGenerationIds(flashcardsData, userId);

      // Prepare data for insertion
      const flashcardsToInsert = flashcardsData.map((flashcard) => ({
        user_id: userId,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
      }));

      // Perform batch insert
      const { data: createdFlashcards, error } = await this.supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select("id, front, back, source, generation_id, created_at, updated_at");

      if (error) {
        throw new Error(`Failed to create flashcards: ${error.message}`);
      }

      if (!createdFlashcards || createdFlashcards.length === 0) {
        throw new Error("No flashcards were created");
      }

      return createdFlashcards as FlashcardDto[];
    } catch (error) {
      // Log error for debugging
      // eslint-disable-next-line no-console
      console.error("Error in createFlashcards:", error);

      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred while creating flashcards");
    }
  }

  /**
   * Validates that all provided generation_ids exist in the database
   * @param flashcardsData Array of flashcard data to validate
   * @param userId User ID from authenticated session
   */
  private async validateGenerationIds(flashcardsData: FlashcardCreateDto[], userId: string): Promise<void> {
    // Extract unique generation_ids that are not null
    const generationIds = Array.from(
      new Set(flashcardsData.map((flashcard) => flashcard.generation_id).filter((id): id is number => id !== null))
    );

    // If no generation_ids to validate, return early
    if (generationIds.length === 0) {
      return;
    }

    // Check if all generation_ids exist and belong to the current user
    const { data: existingGenerations, error } = await this.supabase
      .from("generations")
      .select("id")
      .in("id", generationIds)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to validate generation IDs: ${error.message}`);
    }

    // Check if all generation_ids were found
    const existingIds = existingGenerations?.map((gen) => gen.id) || [];
    const missingIds = generationIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      throw new Error(
        `Invalid generation_id(s): ${missingIds.join(", ")}. Generation(s) not found or do not belong to the current user.`
      );
    }
  }

  /**
   * Retrieves flashcards by generation_id
   * @param generationId ID of the generation
   * @param userId User ID from authenticated session
   * @returns Array of flashcards for the given generation
   */
  async getFlashcardsByGenerationId(generationId: number, userId: string): Promise<FlashcardDto[]> {
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .eq("generation_id", generationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to retrieve flashcards: ${error.message}`);
    }

    return (flashcards as FlashcardDto[]) || [];
  }

  /**
   * Retrieves all flashcards for the current user
   * @param userId User ID from authenticated session
   * @returns Array of all user's flashcards
   */
  async getAllFlashcards(userId: string): Promise<FlashcardDto[]> {
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to retrieve flashcards: ${error.message}`);
    }

    return (flashcards as FlashcardDto[]) || [];
  }

  /**
   * Retrieves flashcards with pagination, filtering and sorting
   * @param userId User ID from authenticated session
   * @param options Pagination, filtering and sorting options
   * @returns Paginated list of flashcards
   */
  async getFlashcards(
    userId: string,
    options: {
      page: number;
      limit: number;
      sort?: "created_at" | "updated_at" | "front" | "source";
      order?: "asc" | "desc";
      source?: Source;
      generation_id?: number;
    }
  ): Promise<FlashcardsListResponseDto> {
    const { page, limit, sort = "created_at", order = "desc", source, generation_id } = options;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
      .eq("user_id", userId);

    // Apply filters
    if (source) {
      query = query.eq("source", source);
    }

    if (generation_id !== undefined) {
      query = query.eq("generation_id", generation_id);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: flashcards, error, count } = await query;

    if (error) {
      throw new Error(`Failed to retrieve flashcards: ${error.message}`);
    }

    return {
      data: (flashcards as FlashcardDto[]) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  /**
   * Retrieves a single flashcard by ID
   * @param id Flashcard ID
   * @param userId User ID from authenticated session (for RLS)
   * @returns Flashcard or null if not found
   */
  async getFlashcardById(id: number, userId: string): Promise<FlashcardDto | null> {
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      // If error is "not found", return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to retrieve flashcard: ${error.message}`);
    }

    return flashcard as FlashcardDto;
  }

  /**
   * Updates an existing flashcard
   * Automatically changes source from "ai-full" to "ai-edited" when editing AI-generated flashcards
   * @param id Flashcard ID
   * @param userId User ID from authenticated session (for RLS)
   * @param updateData Data to update
   * @returns Updated flashcard
   */
  async updateFlashcard(id: number, userId: string, updateData: FlashcardUpdateDto): Promise<FlashcardDto> {
    // First, get the existing flashcard to check its source
    const existingFlashcard = await this.getFlashcardById(id, userId);

    if (!existingFlashcard) {
      throw new Error("Flashcard not found");
    }

    // Prepare update data
    const dataToUpdate: Record<string, string | number | null> = {};

    if (updateData.front !== undefined) {
      dataToUpdate.front = updateData.front;
    }

    if (updateData.back !== undefined) {
      dataToUpdate.back = updateData.back;
    }

    // Auto-change source from "ai-full" to "ai-edited" when editing
    if (existingFlashcard.source === "ai-full") {
      dataToUpdate.source = "ai-edited";
    }

    // Perform update
    const { data: updatedFlashcard, error } = await this.supabase
      .from("flashcards")
      .update(dataToUpdate)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, front, back, source, generation_id, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    if (!updatedFlashcard) {
      throw new Error("Flashcard not found after update");
    }

    return updatedFlashcard as FlashcardDto;
  }

  /**
   * Deletes a flashcard
   * @param id Flashcard ID
   * @param userId User ID from authenticated session (for RLS)
   */
  async deleteFlashcard(id: number, userId: string): Promise<void> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }
}
