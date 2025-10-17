import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and tailwind variants", () => {
    expect(cn("p-2", "text-sm", undefined, false && "hidden", "p-3")).toBe("text-sm p-3");
  });
});


