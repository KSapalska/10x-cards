import crypto from "crypto";
import type { FlashcardProposalDto, GenerationCreateResponseDto } from "../types";
import type { SupabaseClient } from "../db/supabase.client";
import { DEFAULT_USER_ID } from "../db/supabase.client";

export class GenerationService {
  constructor(private readonly supabase: SupabaseClient) {}

  async generateFlashcards(sourceText: string): Promise<GenerationCreateResponseDto> {
    try {
      // 1. Calculate metadata
      const startTime = Date.now();
      const sourceTextHash = await this.calculateHash(sourceText);

      // 2. Call AI service through OpenRouter
      const proposals = await this.callAIService(sourceText);

      // 3. Save generation metadata
      const generationId = await this.saveGenerationMetadata({
        sourceText,
        sourceTextHash,
        generatedCount: proposals.length,
        durationMs: Date.now() - startTime,
      });

      return {
        generation_id: generationId,
        flashcards_proposals: proposals,
        generated_count: proposals.length,
      };
    } catch (error) {
      // Log error and save to generation_error_logs
      await this.logGenerationError(error, {
        sourceTextHash: await this.calculateHash(sourceText),
        sourceTextLength: sourceText.length,
      });
      throw error;
    }
  }

  private async calculateHash(text: string): Promise<string> {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  private async callAIService(text: string): Promise<FlashcardProposalDto[]> {
    // Mock implementation with artificial delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // generate 3 mock flashcards based on the text length

    return Array.from({ length: 3 }, (_, i) => ({
      front: `Mock Question ${i + 1} (text length: ${text.length})`,
      back: `Mock Answer ${i + 1}`,
      source: "ai-full" as const,
    }));
  }

  private async saveGenerationMetadata(data: {
    sourceText: string;
    sourceTextHash: string;
    generatedCount: number;
    durationMs: number;
  }): Promise<number> {
    const { data: generation, error } = await this.supabase
      .from("generations")
      .insert({
        user_id: DEFAULT_USER_ID,
        source_text_hash: data.sourceTextHash,
        source_text_length: data.sourceText.length,
        generated_count: data.generatedCount,
        generation_duration: data.durationMs,
        model: "gpt-4",
      })
      .select("id")
      .single();

    if (error) throw error;
    return generation.id;
  }

  private async logGenerationError(
    error: unknown,
    data: {
      sourceTextHash: string;
      sourceTextLength: number;
    }
  ): Promise<void> {
    await this.supabase.from("generation_error_logs").insert({
      user_id: DEFAULT_USER_ID,
      error_code: error instanceof Error ? error.name : "UNKNOWN",
      error_message: error instanceof Error ? error.message : String(error),
      model: "gpt-4",
      source_text_hash: data.sourceTextHash,
      source_text_length: data.sourceTextLength,
    });
  }
}
