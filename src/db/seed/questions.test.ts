import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { phase1QuestionsFor } from "./demo";
import { questionDefinitionSchema } from "@/lib/questions/definition";
it("fresh demo templates contain seven standards and four to eight valid role questions", () => {
  for (let dept = 1; dept <= 6; dept++) {
    for (const allTypes of [false, true]) {
      const { standards, roles } = phase1QuestionsFor(dept, allTypes);
      expect(standards).toHaveLength(7);
      expect(roles.length >= 4 && roles.length <= 8).toBe(true);
      const all = [...standards, ...roles];
      for (const [sortOrder, q] of all.entries())
        expect(
          questionDefinitionSchema.safeParse({ ...q, id: crypto.randomUUID(), sortOrder }).success,
        ).toBe(true);
      if (allTypes) expect(new Set(all.map((q) => q.type)).size).toBe(11);
    }
  }
});
