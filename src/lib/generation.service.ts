import crypto from "crypto";
import type { FlashcardProposalDto, GenerationCreateResponseDto } from "../types";
import type { SupabaseClient } from "../db/supabase.client";
import { DEFAULT_USER_ID } from "../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import type { JSONSchema } from "./openrouter.types";
import { OpenRouterError } from "./openrouter.types";

// Schemat JSON dla odpowiedzi z flashcards
const FLASHCARDS_RESPONSE_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            description: "Pytanie/przód fiszki (max 200 znaków)",
            maxLength: 200,
          },
          back: {
            type: "string",
            description: "Odpowiedź/tył fiszki (max 500 znaków)",
            maxLength: 500,
          },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

// Prompt systemowy dla generowania flashcards
const SYSTEM_PROMPT = `Jesteś asystentem AI specjalizującym się w tworzeniu fiszek edukacyjnych (flashcards) na podstawie podanego tekstu źródłowego.

Twoim zadaniem jest:
1. Przeanalizować dostarczony tekst i zidentyfikować kluczowe informacje, fakty, definicje i koncepcje.
2. Stworzyć zestaw fiszek, które pomogą w nauce i zapamiętaniu najważniejszych treści.
3. Każda fiszka powinna zawierać:
   - front: pytanie, termin lub podpowiedź (max 200 znaków)
   - back: odpowiedź, definicję lub wyjaśnienie (max 500 znaków)

Wytyczne:
- Twórz pytania konkretne i jednoznaczne
- Odpowiedzi powinny być zwięzłe ale kompletne
- Unikaj zbyt długich pytań i odpowiedzi
- Staraj się pokryć różne aspekty tekstu
- Generuj od 5 do 15 fiszek w zależności od objętości i złożoności tekstu
- Używaj języka z tekstu źródłowego (jeśli tekst po polsku - po polsku, jeśli po angielsku - po angielsku)

Odpowiadaj wyłącznie w formacie JSON zgodnym ze schematem.`;

export class GenerationService {
  private readonly openRouter: OpenRouterService;
  
  constructor(
    private readonly supabase: SupabaseClient,
    openRouterApiKey: string
  ) {
    this.openRouter = new OpenRouterService({
      apiKey: openRouterApiKey,
    });
    
    // Konfiguracja OpenRouter dla generowania flashcards
    this.openRouter.setSystemMessage(SYSTEM_PROMPT);
    this.openRouter.setResponseFormat(FLASHCARDS_RESPONSE_SCHEMA);
    this.openRouter.setModel("openai/gpt-4o-mini", {
      temperature: 0.7,
      top_p: 1,
    });
  }

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
    try {
      // Wyślij tekst do OpenRouter
      const responseContent = await this.openRouter.sendChatMessage(text);

      // Parsuj odpowiedź JSON
      const parsedResponse = JSON.parse(responseContent) as {
        flashcards: Array<{ front: string; back: string }>;
      };

      // Walidacja odpowiedzi
      if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
        throw new Error("Invalid response structure: missing flashcards array");
      }

      if (parsedResponse.flashcards.length === 0) {
        throw new Error("No flashcards generated");
      }

      // Konwertuj na FlashcardProposalDto
      const proposals: FlashcardProposalDto[] = parsedResponse.flashcards.map((card) => ({
        front: card.front.substring(0, 200), // Upewnij się że nie przekracza limitu
        back: card.back.substring(0, 500),   // Upewnij się że nie przekracza limitu
        source: "ai-full" as const,
      }));

      return proposals;
    } catch (error) {
      // Jeśli to błąd parsowania JSON, rzuć nowy błąd z kontekstem
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response: ${error.message}`);
      }
      // Przepuść błędy OpenRouter dalej
      throw error;
    }
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
        model: "openai/gpt-4o-mini",
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
    let errorCode = "UNKNOWN";
    let errorMessage = String(error);

    if (error instanceof Error) {
      errorCode = error.name;
      errorMessage = error.message;
    }

    // Jeśli to błąd OpenRouter, użyj jego kodu
    if (error instanceof OpenRouterError) {
      errorCode = error.code;
    }

    await this.supabase.from("generation_error_logs").insert({
      user_id: DEFAULT_USER_ID,
      error_code: errorCode,
      error_message: errorMessage,
      model: "openai/gpt-4o-mini",
      source_text_hash: data.sourceTextHash,
      source_text_length: data.sourceTextLength,
    });
  }
}
