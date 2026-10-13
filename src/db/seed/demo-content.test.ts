import { describe, expect, it } from "vitest";
import { demoJobContent, legacyDemoPlaceholders, mayUpgradeDemoContent } from "./demo-content";
import { jobData } from "./data";

const baseJob = {
  id: "00000000-0000-4000-8000-000000000001",
  createdAt: new Date("2026-09-01T00:00:00Z"),
  updatedAt: new Date("2026-09-01T00:00:00Z"),
  ...legacyDemoPlaceholders("Web Developer"),
};

describe("demo job content", () => {
  it("covers every seeded job exactly once", () => {
    for (const [, slug] of jobData) expect(demoJobContent[slug], `content for ${slug}`).toBeDefined();
    expect(Object.keys(demoJobContent)).toHaveLength(jobData.length);
  });

  it("matches the documented shape and stays inside validation limits", () => {
    for (const [slug, content] of Object.entries(demoJobContent)) {
      expect(content.summary.length, `${slug}: summary <= 160 chars`).toBeLessThanOrEqual(160);
      expect(content.summary.length, `${slug}: summary not empty`).toBeGreaterThan(0);
      const paragraphs = content.descriptionMd.split("\n\n");
      expect(paragraphs.length, `${slug}: 2-3 description paragraphs`).toBeGreaterThanOrEqual(2);
      expect(paragraphs.length, `${slug}: 2-3 description paragraphs`).toBeLessThanOrEqual(3);
      expect(content.responsibilitiesMd.split("\n"), `${slug}: 5 responsibilities`).toHaveLength(5);
      expect(content.requirementsMd.split("\n"), `${slug}: 5 requirements`).toHaveLength(5);
      expect(content.niceToHaveMd.split("\n"), `${slug}: 2 nice-to-have`).toHaveLength(2);
      expect(content.skills.length, `${slug}: 6-8 skills`).toBeGreaterThanOrEqual(6);
      expect(content.skills.length, `${slug}: 6-8 skills`).toBeLessThanOrEqual(8);
      expect(content.benefits, `${slug}: 4 benefits`).toHaveLength(4);
      for (const skill of content.skills) expect(skill.length, `${slug}: skill <= 40 chars`).toBeLessThanOrEqual(40);
      for (const benefit of content.benefits) expect(benefit.length, `${slug}: benefit <= 60 chars`).toBeLessThanOrEqual(60);
      if (content.vacancies !== undefined) expect(content.vacancies).toBeGreaterThanOrEqual(1);
      if (content.experienceText !== undefined) expect(content.experienceText.length).toBeLessThanOrEqual(60);
      if (content.salaryText !== undefined) {
        expect(content.salaryText.length, `${slug}: salary <= 80 chars`).toBeLessThanOrEqual(80);
        expect(content.salaryText).not.toMatch(/[\r\n]/);
      }
    }
  });

  it("contains no lorem ipsum, raw HTML or Markdown links in user-facing text", () => {
    for (const [slug, content] of Object.entries(demoJobContent)) {
      const text = [
        content.summary, content.descriptionMd, content.responsibilitiesMd,
        content.requirementsMd, content.niceToHaveMd, ...content.skills, ...content.benefits,
      ].join("\n");
      expect(text, `${slug}: no raw HTML`).not.toMatch(/<[^>]+>/);
      expect(text, `${slug}: no Markdown links`).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
      expect(text, `${slug}: no lorem ipsum`).not.toMatch(/lorem ipsum/i);
    }
  });

  it("gives a mix of jobs vacancies, salary ranges, experience text and deadlines", () => {
    const all = Object.values(demoJobContent);
    expect(all.filter((content) => content.vacancies !== undefined).length).toBeGreaterThanOrEqual(3);
    expect(all.filter((content) => content.salaryText !== undefined).length).toBeGreaterThanOrEqual(3);
    expect(all.filter((content) => content.experienceText !== undefined).length).toBeGreaterThanOrEqual(5);
    expect(all.filter((content) => content.deadlineInDays !== undefined).length).toBeGreaterThanOrEqual(3);
  });
});

describe("mayUpgradeDemoContent", () => {
  it("upgrades an untouched Phase 0 demo row", () => {
    expect(mayUpgradeDemoContent(baseJob, baseJob.id, "Web Developer")).toBe(true);
  });

  it("never touches owner-edited rows", () => {
    expect(mayUpgradeDemoContent({ ...baseJob, updatedAt: new Date("2026-10-01T00:00:00Z") }, baseJob.id, "Web Developer")).toBe(false);
    expect(mayUpgradeDemoContent({ ...baseJob, summary: "Owner wrote this" }, baseJob.id, "Web Developer")).toBe(false);
    expect(mayUpgradeDemoContent({ ...baseJob, descriptionMd: "Owner description" }, baseJob.id, "Web Developer")).toBe(false);
    expect(mayUpgradeDemoContent(baseJob, "11111111-1111-4111-8111-111111111111", "Web Developer")).toBe(false);
  });

  it("is not offered again once the realistic content is in place", () => {
    const upgraded = { ...baseJob, ...demoJobContent["web-developer"], updatedAt: new Date("2026-10-14T00:00:00Z") };
    expect(mayUpgradeDemoContent(upgraded, baseJob.id, "Web Developer")).toBe(false);
  });
});
