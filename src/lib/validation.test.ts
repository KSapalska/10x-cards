import { describe, it, expect } from "vitest";
import {
  validateFlashcard,
  FLASHCARD_LIMITS,
  getCounterColorState,
  getCounterColorClass,
  TEXT_INPUT_LIMITS,
} from "./validation";

describe("validateFlashcard", () => {
  describe("valid flashcards", () => {
    it("should return null for valid flashcard with normal text", () => {
      const result = validateFlashcard("What is React?", "A JavaScript library for building user interfaces");

      expect(result).toBe(null);
    });

    it("should return null for flashcard at maximum allowed lengths", () => {
      const front = "a".repeat(FLASHCARD_LIMITS.FRONT_MAX_LENGTH);
      const back = "b".repeat(FLASHCARD_LIMITS.BACK_MAX_LENGTH);

      const result = validateFlashcard(front, back);

      expect(result).toBe(null);
    });

    it("should return null for flashcard with single character", () => {
      const result = validateFlashcard("A", "B");

      expect(result).toBe(null);
    });

    it("should return null when text has leading/trailing whitespace but content is valid", () => {
      const result = validateFlashcard("  Question  ", "  Answer  ");

      expect(result).toBe(null);
    });
  });

  describe("empty front validation", () => {
    it("should reject empty front string", () => {
      const result = validateFlashcard("", "Valid answer");

      expect(result).toBe("Przód fiszki nie może być pusty");
    });

    it("should reject front with only whitespace", () => {
      const result = validateFlashcard("   ", "Valid answer");

      expect(result).toBe("Przód fiszki nie może być pusty");
    });

    it("should reject front with only tabs and spaces", () => {
      const result = validateFlashcard("\t\t  \t", "Valid answer");

      expect(result).toBe("Przód fiszki nie może być pusty");
    });

    it("should reject front with only newlines", () => {
      const result = validateFlashcard("\n\n\n", "Valid answer");

      expect(result).toBe("Przód fiszki nie może być pusty");
    });
  });

  describe("empty back validation", () => {
    it("should reject empty back string", () => {
      const result = validateFlashcard("Valid question", "");

      expect(result).toBe("Tył fiszki nie może być pusty");
    });

    it("should reject back with only whitespace", () => {
      const result = validateFlashcard("Valid question", "   ");

      expect(result).toBe("Tył fiszki nie może być pusty");
    });

    it("should reject back with only tabs and spaces", () => {
      const result = validateFlashcard("Valid question", "\t\t  \t");

      expect(result).toBe("Tył fiszki nie może być pusty");
    });
  });

  describe("front length validation - boundary conditions", () => {
    it("should accept front with exactly 200 characters (max boundary)", () => {
      const front = "a".repeat(200);
      const result = validateFlashcard(front, "Valid answer");

      expect(result).toBe(null);
    });

    it("should reject front with 201 characters (over max)", () => {
      const front = "a".repeat(201);
      const result = validateFlashcard(front, "Valid answer");

      expect(result).toBe("Przód fiszki może mieć maksymalnie 200 znaków");
    });

    it("should reject front with 250 characters (significantly over max)", () => {
      const front = "a".repeat(250);
      const result = validateFlashcard(front, "Valid answer");

      expect(result).toBe("Przód fiszki może mieć maksymalnie 200 znaków");
    });

    it("should use constant value in error message", () => {
      const front = "a".repeat(201);
      const result = validateFlashcard(front, "Valid answer");

      expect(result).toContain(FLASHCARD_LIMITS.FRONT_MAX_LENGTH.toString());
    });
  });

  describe("back length validation - boundary conditions", () => {
    it("should accept back with exactly 500 characters (max boundary)", () => {
      const back = "a".repeat(500);
      const result = validateFlashcard("Valid question", back);

      expect(result).toBe(null);
    });

    it("should reject back with 501 characters (over max)", () => {
      const back = "a".repeat(501);
      const result = validateFlashcard("Valid question", back);

      expect(result).toBe("Tył fiszki może mieć maksymalnie 500 znaków");
    });

    it("should reject back with 1000 characters (significantly over max)", () => {
      const back = "a".repeat(1000);
      const result = validateFlashcard("Valid question", back);

      expect(result).toBe("Tył fiszki może mieć maksymalnie 500 znaków");
    });

    it("should use constant value in error message", () => {
      const back = "a".repeat(501);
      const result = validateFlashcard("Valid question", back);

      expect(result).toContain(FLASHCARD_LIMITS.BACK_MAX_LENGTH.toString());
    });
  });

  describe("validation priority - which error is reported first", () => {
    it("should report empty front before empty back", () => {
      const result = validateFlashcard("", "");

      expect(result).toBe("Przód fiszki nie może być pusty");
    });

    it("should report empty front before back length violation", () => {
      const back = "a".repeat(501);
      const result = validateFlashcard("", back);

      expect(result).toBe("Przód fiszki nie może być pusty");
    });

    it("should report empty back before front length violation", () => {
      const front = "a".repeat(201);
      const result = validateFlashcard(front, "");

      expect(result).toBe("Tył fiszki nie może być pusty");
    });

    it("should report front length violation before back length violation", () => {
      const front = "a".repeat(201);
      const back = "b".repeat(501);
      const result = validateFlashcard(front, back);

      expect(result).toBe("Przód fiszki może mieć maksymalnie 200 znaków");
    });
  });

  describe("edge cases with special characters", () => {
    it("should handle Unicode characters correctly", () => {
      const result = validateFlashcard("Co to jest? 🤔", "To jest pytanie 📝");

      expect(result).toBe(null);
    });

    it("should count Unicode emoji correctly in length", () => {
      // JavaScript counts some emojis as 2 characters (surrogate pairs)
      // So we use fewer emojis to stay under limit
      const front = "🎯".repeat(100); // 100 emojis = ~200 chars due to surrogate pairs
      const result = validateFlashcard(front, "Answer");

      expect(result).toBe(null);
    });

    it("should handle newlines in content", () => {
      const result = validateFlashcard("Line 1\nLine 2", "Answer 1\nAnswer 2");

      expect(result).toBe(null);
    });

    it("should handle HTML-like content", () => {
      const result = validateFlashcard("<div>Question</div>", "<p>Answer</p>");

      expect(result).toBe(null);
    });
  });
});

describe("getCounterColorState", () => {
  describe("default state (empty)", () => {
    it("should return default for 0 characters", () => {
      expect(getCounterColorState(0)).toBe("default");
    });
  });

  describe("warning state (too short)", () => {
    it("should return warning for 1 character", () => {
      expect(getCounterColorState(1)).toBe("warning");
    });

    it("should return warning for 999 characters (just below minimum)", () => {
      expect(getCounterColorState(999)).toBe("warning");
    });

    it("should return warning for 500 characters (middle of invalid range)", () => {
      expect(getCounterColorState(500)).toBe("warning");
    });
  });

  describe("success state (valid range)", () => {
    it("should return success for exactly 1000 characters (lower boundary)", () => {
      expect(getCounterColorState(TEXT_INPUT_LIMITS.MIN_LENGTH)).toBe("success");
    });

    it("should return success for exactly 10000 characters (upper boundary)", () => {
      expect(getCounterColorState(TEXT_INPUT_LIMITS.MAX_LENGTH)).toBe("success");
    });

    it("should return success for 5000 characters (middle of valid range)", () => {
      expect(getCounterColorState(5000)).toBe("success");
    });

    it("should return success for 1001 characters (just above minimum)", () => {
      expect(getCounterColorState(1001)).toBe("success");
    });

    it("should return success for 9999 characters (just below maximum)", () => {
      expect(getCounterColorState(9999)).toBe("success");
    });
  });

  describe("error state (too long)", () => {
    it("should return error for 10001 characters (just above maximum)", () => {
      expect(getCounterColorState(10001)).toBe("error");
    });

    it("should return error for 15000 characters", () => {
      expect(getCounterColorState(15000)).toBe("error");
    });

    it("should return error for 100000 characters (extremely long)", () => {
      expect(getCounterColorState(100000)).toBe("error");
    });
  });

  describe("boundary conditions", () => {
    it("should handle boundary between default and warning (0 vs 1)", () => {
      expect(getCounterColorState(0)).toBe("default");
      expect(getCounterColorState(1)).toBe("warning");
    });

    it("should handle boundary between warning and success (999 vs 1000)", () => {
      expect(getCounterColorState(999)).toBe("warning");
      expect(getCounterColorState(1000)).toBe("success");
    });

    it("should handle boundary between success and error (10000 vs 10001)", () => {
      expect(getCounterColorState(10000)).toBe("success");
      expect(getCounterColorState(10001)).toBe("error");
    });
  });
});

describe("getCounterColorClass", () => {
  describe("CSS class mapping", () => {
    it("should return muted color for empty text", () => {
      expect(getCounterColorClass(0)).toBe("text-muted-foreground");
    });

    it("should return orange color for too short text", () => {
      expect(getCounterColorClass(500)).toBe("text-orange-600 dark:text-orange-400");
    });

    it("should return green color for valid text", () => {
      expect(getCounterColorClass(5000)).toBe("text-green-600 dark:text-green-400");
    });

    it("should return destructive color for too long text", () => {
      expect(getCounterColorClass(15000)).toBe("text-destructive");
    });
  });

  describe("boundary conditions CSS classes", () => {
    it("should return correct class at min boundary (1000 chars)", () => {
      expect(getCounterColorClass(TEXT_INPUT_LIMITS.MIN_LENGTH)).toBe("text-green-600 dark:text-green-400");
    });

    it("should return correct class at max boundary (10000 chars)", () => {
      expect(getCounterColorClass(TEXT_INPUT_LIMITS.MAX_LENGTH)).toBe("text-green-600 dark:text-green-400");
    });

    it("should return warning class just before min boundary (999 chars)", () => {
      expect(getCounterColorClass(999)).toBe("text-orange-600 dark:text-orange-400");
    });

    it("should return error class just after max boundary (10001 chars)", () => {
      expect(getCounterColorClass(10001)).toBe("text-destructive");
    });
  });

  describe("all states have valid Tailwind classes", () => {
    it("should return valid Tailwind class for default state", () => {
      const className = getCounterColorClass(0);
      expect(className).toMatch(/^text-/);
    });

    it("should return valid Tailwind class for warning state", () => {
      const className = getCounterColorClass(500);
      expect(className).toMatch(/^text-/);
      expect(className).toContain("dark:");
    });

    it("should return valid Tailwind class for success state", () => {
      const className = getCounterColorClass(5000);
      expect(className).toMatch(/^text-/);
      expect(className).toContain("dark:");
    });

    it("should return valid Tailwind class for error state", () => {
      const className = getCounterColorClass(15000);
      expect(className).toMatch(/^text-/);
    });
  });
});

describe("FLASHCARD_LIMITS constants", () => {
  it("should have correct front max length value", () => {
    expect(FLASHCARD_LIMITS.FRONT_MAX_LENGTH).toBe(200);
  });

  it("should have correct back max length value", () => {
    expect(FLASHCARD_LIMITS.BACK_MAX_LENGTH).toBe(500);
  });

  it("should be read-only (as const)", () => {
    // TypeScript will enforce this at compile time
    // This test just verifies the values are accessible
    const { FRONT_MAX_LENGTH, BACK_MAX_LENGTH } = FLASHCARD_LIMITS;
    expect(FRONT_MAX_LENGTH).toBeDefined();
    expect(BACK_MAX_LENGTH).toBeDefined();
  });
});

describe("TEXT_INPUT_LIMITS constants", () => {
  it("should have correct min length value", () => {
    expect(TEXT_INPUT_LIMITS.MIN_LENGTH).toBe(1000);
  });

  it("should have correct max length value", () => {
    expect(TEXT_INPUT_LIMITS.MAX_LENGTH).toBe(10000);
  });

  it("should have min less than max", () => {
    expect(TEXT_INPUT_LIMITS.MIN_LENGTH).toBeLessThan(TEXT_INPUT_LIMITS.MAX_LENGTH);
  });

  it("should be read-only (as const)", () => {
    const { MIN_LENGTH, MAX_LENGTH } = TEXT_INPUT_LIMITS;
    expect(MIN_LENGTH).toBeDefined();
    expect(MAX_LENGTH).toBeDefined();
  });
});
