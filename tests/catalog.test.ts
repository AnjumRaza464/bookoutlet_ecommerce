import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

const { buildWhere, catalogHref, parseFilters } = await import("@/lib/catalog");
const { parseRange, pkDay, toCsv } = await import("@/lib/reports");

describe("parseFilters", () => {
  it("parses and sanitises query params", () => {
    const f = parseFilters({ class: "11", level: "intermediate", sort: "price-asc", page: "3", min: "100", max: "-5", stock: "1", q: "  physics " });
    expect(f).toMatchObject({ classLevel: 11, level: "INTERMEDIATE", sort: "price-asc", page: 3, minPrice: 100, maxPrice: undefined, inStock: true, q: "physics" });
  });
  it("ignores invalid class, sort and level values", () => {
    const f = parseFilters({ class: "7", sort: "drop table", level: "x", page: "-2" });
    expect(f.classLevel).toBeUndefined();
    expect(f.sort).toBe("newest");
    expect(f.level).toBeUndefined();
    expect(f.page).toBe(1);
  });
});

describe("buildWhere", () => {
  it("always restricts to active books and maps filters to relations", () => {
    const w = buildWhere({ board: "bise-lahore", subject: "physics", category: "notes", classLevel: 9, inStock: true });
    expect(w).toMatchObject({ isActive: true, classLevel: 9, board: { slug: "bise-lahore" }, subject: { slug: "physics" }, category: { slug: "notes" }, stock: { gt: 0 } });
  });
  it("builds a case-insensitive text search", () => {
    const w = buildWhere({ q: "chem" });
    expect(Array.isArray(w.OR)).toBe(true);
    expect(w.OR?.[0]).toEqual({ title: { contains: "chem", mode: "insensitive" } });
  });
});

describe("catalogHref", () => {
  it("merges overrides, removes cleared keys and resets page", () => {
    expect(catalogHref({ class: "9", page: "4", board: "x" }, { board: null })).toBe("/books?class=9");
    expect(catalogHref({ class: "9" }, { page: 2 })).toBe("/books?class=9&page=2");
  });
});

describe("reports helpers", () => {
  it("escapes CSV and neutralises formula injection", () => {
    expect(toCsv([["a,b", 'say "hi"', "=SUM(A1)", 5]])).toBe('"a,b","say ""hi""",\'=SUM(A1),5');
  });
  it("parses date ranges in Pakistan time with a 30-day default", () => {
    const r = parseRange("2026-10-01", "2026-10-07");
    expect(pkDay(r.from)).toBe("2026-10-01");
    expect(pkDay(r.to)).toBe("2026-10-07");
    const d = parseRange();
    expect(Math.round((d.to.getTime() - d.from.getTime()) / 86_400_000)).toBe(30);
  });
  it("swaps reversed ranges", () => {
    const r = parseRange("2026-10-07", "2026-10-01");
    expect(r.from < r.to).toBe(true);
  });
});
