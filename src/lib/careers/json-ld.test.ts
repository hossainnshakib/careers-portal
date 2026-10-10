import { describe, expect, it } from "vitest";
import { buildJobPosting, markdownToPlainText } from "./json-ld";

const base = {
  title: "Web Developer",
  summary: "Build thoughtful web experiences.",
  descriptionMd: "**Build** things that matter.\n\n- Item one\n- Item two",
  slug: "web-developer",
  locationText: "Dhaka",
  status: "open",
  deadlineAt: null as string | null,
  publishedAt: "2026-09-01T00:00:00Z",
  departmentName: "Technical",
  options: [
    { group: "engagement", slug: "full_time", label: "Full-time" },
    { group: "arrangement", slug: "onsite", label: "On-site" },
  ],
  brand: { name: "Fixen Media", website: "https://fixen.media", logoUrl: "/brands/fixen-media.svg" },
  siteOrigin: "https://careers.example.test",
};

describe("markdownToPlainText", () => {
  it("strips markdown syntax to readable plain text", () => {
    expect(markdownToPlainText("**Bold** and *italic* and `code`")).toBe("Bold and italic and code");
    expect(markdownToPlainText("- item\n- item")).toBe("item item");
    expect(markdownToPlainText("[link text](https://example.com)")).toBe("link text");
    expect(markdownToPlainText("# Heading\n\nParagraph.")).toBe("Heading Paragraph.");
  });
  it("removes code blocks and images", () => {
    expect(markdownToPlainText("```\ncode\n```\ntext")).toBe("text");
    expect(markdownToPlainText("![alt](img.png)text")).toBe("text");
  });
});

describe("buildJobPosting", () => {
  it("builds a full JobPosting for an open role", () => {
    const posting = buildJobPosting(base)!;
    expect(posting["@context"]).toBe("https://schema.org");
    expect(posting["@type"]).toBe("JobPosting");
    expect(posting.title).toBe("Web Developer");
    expect(posting.url).toBe("https://careers.example.test/jobs/web-developer");
    expect(posting.datePosted).toBe("2026-09-01T00:00:00Z");
    expect(posting.employmentType).toBe("FULL_TIME");
    expect(posting.description).toContain("Build things that matter");
    expect(posting.hiringOrganization).toMatchObject({ "@type": "Organization", name: "Fixen Media", sameAs: "https://fixen.media" });
    expect(posting.jobLocation).toMatchObject({ "@type": "Place", address: { addressCountry: "BD", addressLocality: "Dhaka" } });
    expect(posting.jobLocationType).toBeUndefined();
  });

  it("returns null for closed, expired and draft jobs", () => {
    expect(buildJobPosting({ ...base, status: "closed" })).toBeNull();
    expect(buildJobPosting({ ...base, status: "draft" })).toBeNull();
    expect(buildJobPosting({ ...base, deadlineAt: "2000-01-01T00:00:00Z" })).toBeNull();
  });

  it("emits validThrough only when a future deadline is set", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(buildJobPosting({ ...base, deadlineAt: future })!.validThrough).toBe(future);
    expect(buildJobPosting(base)!.validThrough).toBeUndefined();
  });

  it("maps engagement labels and slugs to EmploymentType", () => {
    const cases: [string, string][] = [
      ["part_time", "PART_TIME"], ["contract", "CONTRACTOR"], ["freelance", "CONTRACTOR"],
      ["project-based", "CONTRACTOR"], ["duration-based", "CONTRACTOR"], ["internship", "INTERN"],
    ];
    for (const [slug, expected] of cases) {
      const posting = buildJobPosting({ ...base, options: [{ group: "engagement", slug, label: slug }] })!;
      expect(posting.employmentType).toBe(expected);
    }
    // Unknown engagement slug → omit the field rather than guessing.
    expect(buildJobPosting({ ...base, options: [{ group: "engagement", slug: "mystery", label: "Mystery" }] })!.employmentType).toBeUndefined();
  });

  it("sets TELECOMMUTE for Work from home arrangement", () => {
    const posting = buildJobPosting({ ...base, options: [{ group: "arrangement", slug: "remote", label: "Work from home" }] })!;
    expect(posting.jobLocationType).toBe("TELECOMMUTE");
  });

  it("omits fields that have no value", () => {
    const minimal = buildJobPosting({ ...base, summary: null, descriptionMd: "", locationText: null, publishedAt: null, brand: null, options: [] })!;
    expect(minimal.description).toBeUndefined();
    expect(minimal.datePosted).toBeUndefined();
    expect(minimal.jobLocation).toBeUndefined();
    expect(minimal.hiringOrganization).toBeUndefined();
    expect(minimal.employmentType).toBeUndefined();
    expect(minimal.jobLocationType).toBeUndefined();
  });

  it("never includes baseSalary", () => {
    const posting = buildJobPosting({ ...base, options: [...base.options] })!;
    expect(posting.baseSalary).toBeUndefined();
  });

  it("omits brand website and logo when unset", () => {
    const posting = buildJobPosting({ ...base, brand: { name: "Fixen Media", website: null, logoUrl: null } })!;
    const org = posting.hiringOrganization as Record<string, unknown>;
    expect(org.sameAs).toBeUndefined();
    expect(org.logo).toBeUndefined();
    expect(org.name).toBe("Fixen Media");
  });
});
