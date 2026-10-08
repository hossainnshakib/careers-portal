"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sectorEnum, type Brand } from "@/db/schema";
import type { BrandInput } from "@/lib/validation/brands";
import {
  reorderBrandAction,
  saveBrandAction,
  uploadBrandLogoAction,
} from "@/app/admin/(protected)/brands/actions";
import type { ActionResult } from "@/lib/actions/result";
import { BrandLogo } from "@/components/brand-logo";
import { accentColor } from "@/lib/careers/presentation";
import { contrastRatio, readableAccentText } from "@/lib/brands/contrast";

const blank: BrandInput = {
  id: null,
  name: "",
  slug: "",
  sector: "other",
  description: "",
  website: "",
  accentColor: "",
  status: "active",
};
const inputClass = "mt-1 block w-full rounded border border-input bg-card p-2";
const buttonClass = "rounded border border-border px-3 py-2 disabled:opacity-50";

export function BrandManager({ rows }: { rows: Brand[] }) {
  const [draft, setDraft] = useState<BrandInput>(blank);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const previewAccent = accentColor(draft.accentColor);
  const previewText = readableAccentText(previewAccent);
  async function run(action: () => Promise<ActionResult<unknown>>, success: string) {
    setPending(true);
    setMessage("");
    try {
      const result = await action();
      if (result.ok) {
        setMessage(success);
        router.refresh();
      } else setMessage(result.error);
    } catch {
      setMessage("Unable to update brand. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-6">
      <form
        className="max-w-xl space-y-4 rounded border border-border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            const result = await saveBrandAction(draft);
            if (result.ok) setDraft({ ...draft, id: result.data.id });
            return result;
          }, "Brand saved.");
        }}
      >
        <h2 className="font-semibold">{draft.id ? "Edit brand" : "Create brand"}</h2>
        <label className="block">
          Name
          <input
            className={inputClass}
            value={draft.name}
            required
            maxLength={150}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <label className="block">
          Slug
          <input
            className={inputClass}
            value={draft.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={120}
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
          />
        </label>
        <label className="block">
          Sector
          <select
            aria-label="Sector"
            className={inputClass}
            value={draft.sector}
            onChange={(event) =>
              setDraft({ ...draft, sector: event.target.value as BrandInput["sector"] })
            }
          >
            {sectorEnum.enumValues.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Description
          <textarea
            aria-label="Description"
            className={inputClass}
            value={draft.description}
            maxLength={3000}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <label className="block">
          Website
          <input
            className={inputClass}
            type="url"
            value={draft.website}
            maxLength={2048}
            placeholder="https://example.com"
            onChange={(event) => setDraft({ ...draft, website: event.target.value })}
          />
        </label>
        <label className="block">
          Accent color
          <input
            className={inputClass}
            value={draft.accentColor}
            pattern="#[0-9a-fA-F]{6}"
            placeholder="#213F6E"
            onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })}
          />
        </label>
        <section aria-label="Accent contrast preview" className="rounded-lg border border-border p-4" style={{ backgroundColor: previewAccent, color: previewText }}>
          <p className="font-bold">{draft.name || "Brand colour preview"}</p>
          <p className="mt-2">Readable text · {contrastRatio(previewAccent, previewText).toFixed(2)}:1 contrast</p>
        </section>
        <label className="block">
          Status
          <select
            aria-label="Status"
            className={inputClass}
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as BrandInput["status"] })
            }
          >
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className={buttonClass} disabled={pending}>
            {pending ? "Saving…" : "Save brand"}
          </button>
          <button
            className={buttonClass}
            type="button"
            disabled={pending}
            onClick={() => setDraft(blank)}
          >
            New brand
          </button>
        </div>
      </form>
      {draft.id && (
        <form
          className="max-w-xl rounded border border-border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const element = event.currentTarget;
            void run(async () => {
              const result = await uploadBrandLogoAction(form);
              if (result.ok) element.reset();
              return result;
            }, "Logo uploaded.");
          }}
        >
          <input type="hidden" name="brandId" value={draft.id} />
          <label className="block">
            Logo for {draft.name}
            <input
              className={inputClass}
              name="file"
              type="file"
              accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
              required
            />
          </label>
          <p className="my-2 text-sm text-muted-foreground">
            SVG, PNG or WebP, up to 1 MB. SVG must contain passive shapes without styles or external
            resources.
          </p>
          <button className={buttonClass} disabled={pending}>
            Upload logo
          </button>
        </form>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      {rows.length === 0 ? (
        <p>No brands yet. Create the first brand above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Brands in display order</caption>
            <thead>
              <tr className="border-b border-border">
                <th className="p-3">Logo</th>
                <th className="p-3">Name</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="p-3">
                    {row.logoUrl ? (
                      <div className="w-32">
                        <BrandLogo src={row.logoUrl} name={row.name} />
                      </div>
                    ) : (
                      "No logo"
                    )}
                  </td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">{row.sector.replaceAll("_", " ")}</td>
                  <td className="p-3">{row.status === "active" ? "Active" : "Hidden"}</td>
                  <td className="flex gap-2 p-3">
                    <button
                      className={buttonClass}
                      disabled={pending}
                      onClick={() =>
                        setDraft({
                          id: row.id,
                          name: row.name,
                          slug: row.slug,
                          sector: row.sector,
                          description: row.description,
                          website: row.website ?? "",
                          accentColor: row.accentColor ?? "",
                          status: row.status,
                        })
                      }
                    >
                      Edit<span className="sr-only"> {row.name}</span>
                    </button>
                    <button
                      className={buttonClass}
                      disabled={pending || index === 0}
                      aria-label={`Move ${row.name} up`}
                      onClick={() =>
                        void run(
                          () => reorderBrandAction({ id: row.id, direction: "up" }),
                          "Brand order updated.",
                        )
                      }
                    >
                      ↑
                    </button>
                    <button
                      className={buttonClass}
                      disabled={pending || index === rows.length - 1}
                      aria-label={`Move ${row.name} down`}
                      onClick={() =>
                        void run(
                          () => reorderBrandAction({ id: row.id, direction: "down" }),
                          "Brand order updated.",
                        )
                      }
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
