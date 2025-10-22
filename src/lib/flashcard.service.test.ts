import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService } from "./flashcard.service";
import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardDto } from "../types";

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  return mockClient;
};

describe("FlashcardService", () => {
  let service: FlashcardService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new FlashcardService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("getFlashcards", () => {
    it("should return paginated flashcards", async () => {
      const mockFlashcards: FlashcardDto[] = [
        {
          id: 1,
          front: "Question 1",
          back: "Answer 1",
          source: "manual",
          generation_id: null,
          created_at: "2025-01-20T10:00:00Z",
          updated_at: "2025-01-20T10:00:00Z",
        },
        {
          id: 2,
          front: "Question 2",
          back: "Answer 2",
          source: "ai-full",
          generation_id: 1,
          created_at: "2025-01-20T10:05:00Z",
          updated_at: "2025-01-20T10:05:00Z",
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          error: null,
          count: 10,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getFlashcards("user-123", {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: mockFlashcards,
        pagination: {
          page: 1,
          limit: 10,
          total: 10,
        },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should apply filters when provided", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await service.getFlashcards("user-123", {
        page: 1,
        limit: 10,
        source: "ai-full",
        generation_id: 5,
      });

      // Verify filters were applied
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "ai-full");
      expect(mockQuery.eq).toHaveBeenCalledWith("generation_id", 5);
    });

    it("should calculate correct offset for pagination", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      // Page 3 with limit 10 should have offset 20
      await service.getFlashcards("user-123", {
        page: 3,
        limit: 10,
      });

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe("getFlashcardById", () => {
    it("should return flashcard when found", async () => {
      const mockFlashcard: FlashcardDto = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "manual",
        generation_id: null,
        created_at: "2025-01-20T10:00:00Z",
        updated_at: "2025-01-20T10:00:00Z",
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFlashcard,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getFlashcardById(1, "user-123");

      expect(result).toEqual(mockFlashcard);
      expect(mockQuery.eq).toHaveBeenCalledWith("id", 1);
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should return null when flashcard not found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await service.getFlashcardById(999, "user-123");

      expect(result).toBeNull();
    });

    it("should throw error on database error", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "OTHER_ERROR", message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await expect(service.getFlashcardById(1, "user-123")).rejects.toThrow("Failed to retrieve flashcard");
    });
  });

  describe("updateFlashcard", () => {
    it("should update flashcard and return updated data", async () => {
      const existingFlashcard: FlashcardDto = {
        id: 1,
        front: "Old Question",
        back: "Old Answer",
        source: "manual",
        generation_id: null,
        created_at: "2025-01-20T10:00:00Z",
        updated_at: "2025-01-20T10:00:00Z",
      };

      const updatedFlashcard: FlashcardDto = {
        ...existingFlashcard,
        front: "New Question",
        updated_at: "2025-01-20T11:00:00Z",
      };

      // Mock getFlashcardById
      const getQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingFlashcard,
          error: null,
        }),
      };

      // Mock update
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedFlashcard,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(getQuery as any) // for getFlashcardById
        .mockReturnValueOnce(updateQuery as any); // for update

      const result = await service.updateFlashcard(1, "user-123", {
        front: "New Question",
      });

      expect(result).toEqual(updatedFlashcard);
      expect(updateQuery.update).toHaveBeenCalled();
    });

    it("should change source from ai-full to ai-edited when editing", async () => {
      const existingFlashcard: FlashcardDto = {
        id: 1,
        front: "AI Question",
        back: "AI Answer",
        source: "ai-full",
        generation_id: 5,
        created_at: "2025-01-20T10:00:00Z",
        updated_at: "2025-01-20T10:00:00Z",
      };

      const updatedFlashcard: FlashcardDto = {
        ...existingFlashcard,
        front: "Edited Question",
        source: "ai-edited",
        updated_at: "2025-01-20T11:00:00Z",
      };

      const getQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingFlashcard,
          error: null,
        }),
      };

      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedFlashcard,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(getQuery as any)
        .mockReturnValueOnce(updateQuery as any);

      const result = await service.updateFlashcard(1, "user-123", {
        front: "Edited Question",
      });

      expect(result.source).toBe("ai-edited");
      
      // Verify update was called with source: "ai-edited"
      const updateCallArgs = updateQuery.update.mock.calls[0][0];
      expect(updateCallArgs).toHaveProperty("source", "ai-edited");
    });

    it("should NOT change source if already ai-edited", async () => {
      const existingFlashcard: FlashcardDto = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "ai-edited",
        generation_id: 5,
        created_at: "2025-01-20T10:00:00Z",
        updated_at: "2025-01-20T10:00:00Z",
      };

      const getQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingFlashcard,
          error: null,
        }),
      };

      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...existingFlashcard, front: "New" },
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(getQuery as any)
        .mockReturnValueOnce(updateQuery as any);

      await service.updateFlashcard(1, "user-123", {
        front: "New",
      });

      // Verify source was NOT added to update data
      const updateCallArgs = updateQuery.update.mock.calls[0][0];
      expect(updateCallArgs).not.toHaveProperty("source");
    });

    it("should throw error when flashcard not found", async () => {
      const getQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(getQuery as any);

      await expect(service.updateFlashcard(999, "user-123", { front: "New" })).rejects.toThrow(
        "Flashcard not found"
      );
    });
  });

  describe("deleteFlashcard", () => {
    it("should delete flashcard successfully", async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // Last eq() call in chain should return result
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await expect(service.deleteFlashcard(1, "user-123")).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith("id", 1);
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("should throw error on database error", async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({
        error: { message: "Database error" },
      });

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await expect(service.deleteFlashcard(1, "user-123")).rejects.toThrow("Failed to delete flashcard");
    });
  });
});

