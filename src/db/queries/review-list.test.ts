import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { beforeEach, expect, it, vi } from "vitest";
import { reviewFilters } from "@/lib/validation/review";
import { listReviewApplications } from "./review";

const mocks = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ select: mocks.select }) }));
vi.mock("@/db/queries/applications", () => ({ withUploadSession: vi.fn() }));
vi.mock("@/lib/storage/review-files", () => ({ quarantineReviewFiles: vi.fn(), restoreReviewFiles: vi.fn(), removeReviewQuarantine: vi.fn(), signReviewAttachment: vi.fn() }));

beforeEach(() => {
  mocks.select.mockReset();
  mocks.select.mockImplementation((projection: Record<string, unknown>) => {
    const rows = "appliedBefore" in projection ? [{ id: "fixture", appliedBefore: true }] : [{ count: 1 }];
    const chain = {
      from: () => chain, innerJoin: () => chain, where: () => chain,
      orderBy: () => chain, limit: () => chain, offset: () => chain,
      then: (resolve: (value: object[]) => unknown) => Promise.resolve(rows).then(resolve),
    };
    return chain;
  });
});

it("projects a boolean prior-email EXISTS in the bounded list query without additional network reads", async () => {
  const result = await listReviewApplications(reviewFilters.parse({ status: "new", q: "fixture" }));
  expect(result.rows[0].appliedBefore).toBe(true);
  expect(mocks.select).toHaveBeenCalledTimes(2);
  const projection = mocks.select.mock.calls[1][0] as { appliedBefore: SQL };
  const query = new PgDialect().sqlToQuery(projection.appliedBefore);
  expect(query.sql).toMatch(/exists\s*\(\s*select 1 from "applications"(?: as)? "previous_application"/i);
  expect(query.sql).toContain('lower("previous_application"."email") = lower("applications"."email")');
  expect(query.sql).toContain('"previous_application"."submitted_at" < "applications"."submitted_at"');
  expect(query.sql).not.toContain("status");
  expect(query.params).toEqual([]);
});

it("returns an empty bounded page without introducing writes or per-email queries", async () => {
  mocks.select.mockImplementationOnce(() => {
    const chain = { from: () => chain, innerJoin: () => chain, where: async () => [{ count: 0 }] };
    return chain;
  }).mockImplementationOnce(() => {
    const chain = { from: () => chain, innerJoin: () => chain, where: () => chain, orderBy: () => chain, limit: () => chain, offset: async () => [] };
    return chain;
  });
  const result = await listReviewApplications(reviewFilters.parse({ page: 999 }));
  expect(result).toMatchObject({ rows: [], total: 0, page: 1, pages: 1 });
  expect(mocks.select).toHaveBeenCalledTimes(2);
});
