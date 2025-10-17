import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGenerateFlashcards } from "./useGenerateFlashcards";
import type { GenerationCreateResponseDto } from "../../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useGenerateFlashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useGenerateFlashcards());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.errorMessage).toBe(null);
      expect(result.current.generationId).toBe(null);
      expect(result.current.flashcards).toEqual([]);
      expect(typeof result.current.generateFlashcards).toBe("function");
      expect(typeof result.current.resetError).toBe("function");
    });
  });

  describe("validation - boundary conditions", () => {
    it("should reject text shorter than 1000 characters", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const shortText = "a".repeat(999);

      await result.current.generateFlashcards(shortText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Tekst musi zawierać od 1000 do 10000 znaków");
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should reject text longer than 10000 characters", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const longText = "a".repeat(10001);

      await result.current.generateFlashcards(longText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Tekst musi zawierać od 1000 do 10000 znaków");
        expect(result.current.isLoading).toBe(false);
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should accept text with exactly 1000 characters (lower boundary)", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [],
            generated_count: 0,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.current.errorMessage).toBe(null);
      });
    });

    it("should accept text with exactly 10000 characters (upper boundary)", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(10000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [],
            generated_count: 0,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.current.errorMessage).toBe(null);
      });
    });
  });

  describe("successful generation", () => {
    it("should set loading state during API call", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      // Start the generation (don't await yet)
      const generatePromise = result.current.generateFlashcards(validText);

      // Wait for loading state to become true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [],
            generated_count: 0,
          }) satisfies GenerationCreateResponseDto,
      });

      await generatePromise;

      // Check loading state is false after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should transform API response to view models with UI state", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      const mockResponse: GenerationCreateResponseDto = {
        generation_id: 42,
        flashcards_proposals: [
          { front: "Question 1", back: "Answer 1", source: "ai-full" },
          { front: "Question 2", back: "Answer 2", source: "ai-full" },
        ],
        generated_count: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.generationId).toBe(42);
        expect(result.current.flashcards).toHaveLength(2);

        // Verify transformation to ViewModel
        expect(result.current.flashcards[0]).toEqual({
          front: "Question 1",
          back: "Answer 1",
          source: "ai-full",
          accepted: false,
          edited: false,
          id: "42-0",
        });

        expect(result.current.flashcards[1]).toEqual({
          front: "Question 2",
          back: "Answer 2",
          source: "ai-full",
          accepted: false,
          edited: false,
          id: "42-1",
        });
      });
    });

    it("should reset previous state before new generation", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      // First generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [{ front: "Q1", back: "A1", source: "ai-full" }],
            generated_count: 1,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
      });

      // Second generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 2,
            flashcards_proposals: [{ front: "Q2", back: "A2", source: "ai-full" }],
            generated_count: 1,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
        expect(result.current.flashcards[0].front).toBe("Q2");
        expect(result.current.generationId).toBe(2);
      });
    });

    it("should call API with correct parameters", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [],
            generated_count: 0,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source_text: validText }),
        });
      });
    });
  });

  describe("error handling", () => {
    it("should handle HTTP error responses", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Błąd serwera" }),
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Błąd serwera");
        expect(result.current.isLoading).toBe(false);
        expect(result.current.flashcards).toEqual([]);
      });
    });

    it("should handle HTTP error without custom error message", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Błąd podczas generowania fiszek");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Network failure");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle non-Error exceptions", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockRejectedValueOnce("String error");

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Nieznany błąd");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle invalid API response structure (missing flashcards_proposals)", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ generation_id: 1 }),
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Nieprawidłowa odpowiedź serwera");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle invalid API response structure (non-array flashcards_proposals)", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          generation_id: 1,
          flashcards_proposals: "not an array",
        }),
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.errorMessage).toBe("Nieprawidłowa odpowiedź serwera");
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("resetError", () => {
    it("should clear error message", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const invalidText = "short";

      await result.current.generateFlashcards(invalidText);

      await waitFor(() => {
        expect(result.current.errorMessage).not.toBe(null);
      });

      result.current.resetError();

      await waitFor(() => {
        expect(result.current.errorMessage).toBe(null);
      });
    });

    it("should not affect other state", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 42,
            flashcards_proposals: [{ front: "Q", back: "A", source: "ai-full" }],
            generated_count: 1,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
      });

      result.current.resetError();

      expect(result.current.flashcards).toHaveLength(1);
      expect(result.current.generationId).toBe(42);
      expect(result.current.errorMessage).toBe(null);
    });
  });

  describe("unique ID generation", () => {
    it("should generate unique IDs for each flashcard", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 100,
            flashcards_proposals: [
              { front: "Q1", back: "A1", source: "ai-full" },
              { front: "Q2", back: "A2", source: "ai-full" },
              { front: "Q3", back: "A3", source: "ai-full" },
            ],
            generated_count: 3,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        const ids = result.current.flashcards.map((f) => f.id);
        expect(ids).toEqual(["100-0", "100-1", "100-2"]);

        // Verify all IDs are unique
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(3);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty flashcards_proposals array", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            generation_id: 1,
            flashcards_proposals: [],
            generated_count: 0,
          }) satisfies GenerationCreateResponseDto,
      });

      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.flashcards).toEqual([]);
        expect(result.current.generationId).toBe(1);
        expect(result.current.errorMessage).toBe(null);
      });
    });

    it("should handle multiple consecutive calls", async () => {
      const { result } = renderHook(() => useGenerateFlashcards());
      const validText = "a".repeat(1000);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            ({
              generation_id: 1,
              flashcards_proposals: [],
              generated_count: 0,
            }) satisfies GenerationCreateResponseDto,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            ({
              generation_id: 2,
              flashcards_proposals: [],
              generated_count: 0,
            }) satisfies GenerationCreateResponseDto,
        });

      await result.current.generateFlashcards(validText);
      await result.current.generateFlashcards(validText);

      await waitFor(() => {
        expect(result.current.generationId).toBe(2);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});

