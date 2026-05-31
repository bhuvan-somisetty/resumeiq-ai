import { describe, it, expect } from "vitest";
import { scoreHealth, scoreHealthLabel, formatBytes } from "@/lib/utils";

describe("scoreHealth", () => {
  it("buckets scores correctly", () => {
    expect(scoreHealth(90)).toBe("strong");
    expect(scoreHealth(75)).toBe("strong");
    expect(scoreHealth(60)).toBe("ok");
    expect(scoreHealth(50)).toBe("ok");
    expect(scoreHealth(40)).toBe("weak");
    expect(scoreHealth(0)).toBe("weak");
  });

  it("labels match buckets", () => {
    expect(scoreHealthLabel(80)).toBe("Strong");
    expect(scoreHealthLabel(60)).toBe("Getting there");
    expect(scoreHealthLabel(30)).toBe("Needs work");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });
});
