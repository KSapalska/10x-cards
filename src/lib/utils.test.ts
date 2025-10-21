import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  describe("basic functionality", () => {
    it("should merge single class name", () => {
      expect(cn("text-sm")).toBe("text-sm");
    });

    it("should merge multiple class names", () => {
      expect(cn("text-sm", "font-bold", "px-4")).toBe("text-sm font-bold px-4");
    });

    it("should handle empty input", () => {
      expect(cn()).toBe("");
    });
  });

  describe("conditional classes", () => {
    it("should filter out undefined values", () => {
      expect(cn("text-sm", undefined, "font-bold")).toBe("text-sm font-bold");
    });

    it("should filter out null values", () => {
      expect(cn("text-sm", null, "font-bold")).toBe("text-sm font-bold");
    });

    it("should filter out false values", () => {
      expect(cn("text-sm", false, "font-bold")).toBe("text-sm font-bold");
    });

    it("should handle conditional expressions", () => {
      expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
      expect(cn("text-sm", true && "hidden", "font-bold")).toBe("text-sm hidden font-bold");
    });
  });

  describe("Tailwind merge conflicts", () => {
    it("should resolve conflicting padding classes (later wins)", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });

    it("should resolve conflicting text size classes", () => {
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("should resolve conflicting background colors", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("should keep non-conflicting classes from same group", () => {
      expect(cn("px-2", "py-4")).toBe("px-2 py-4");
    });

    it("should resolve complex conflicting classes", () => {
      expect(cn("p-2", "text-sm", undefined, false && "hidden", "p-3")).toBe("text-sm p-3");
    });
  });

  describe("array and object inputs", () => {
    it("should handle array of classes", () => {
      expect(cn(["text-sm", "font-bold"])).toBe("text-sm font-bold");
    });

    it("should handle object with boolean values", () => {
      expect(cn({ "text-sm": true, "font-bold": false, "px-4": true })).toBe("text-sm px-4");
    });

    it("should handle mixed array and string inputs", () => {
      expect(cn("text-sm", ["font-bold", "px-4"])).toBe("text-sm font-bold px-4");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      expect(cn("", "text-sm", "")).toBe("text-sm");
    });

    it("should handle whitespace", () => {
      expect(cn("  text-sm  ", "font-bold")).toBe("text-sm font-bold");
    });

    it("should handle duplicate classes", () => {
      expect(cn("text-sm", "text-sm")).toBe("text-sm");
    });
  });
});
