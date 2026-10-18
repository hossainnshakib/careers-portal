"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sectorEnum, type Brand } from "@/db/schema";
import type { BrandInput } from "@/lib/validation/brands";
import {
  reorderBrandAction,
  saveBrandAction,
  uploadBrandLogoAction,
} from "@/app/admin/(protected)/brands/actions";
import type { ActionResult } from "@/lib/actions/result";
import { BrandMark } from "@/components/admin/brand-mark";
import { Pill } from "@/components/admin/status-badge";
import { accentColor } from "@/lib/careers/presentation";
import { sectorLabels } from "@/lib/admin/display";
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

function editBrand(row: Brand): BrandInput {
  return { id: row.id, name: row.name, slug: row.slug, sector: row.sector, description: row.description, website: row.website ?? "", accentColor: row.accentColor ?? "", status: row.status };
}

export function BrandManager({ rows }: { rows: Brand[] }) {
  const [draft, setDraft] = useState<BrandInput>(() => rows[0] ? editBrand(rows[0]) : blank);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState("");
  const currentLogo = rows.find((row) => row.id === draft.id)?.logoUrl;
  const previewAccent = accentColor(draft.accentColor);
  const previewText = readableAccentText(previewAccent);
  function selectDraft(next: BrandInput) {
    if (logoInputRef.current) logoInputRef.current.value = "";
    setSelectedFile(""); setMessage(""); setDraft(next);
  }
  function selectLogo(file: File | undefined) {
    setMessage("");
    if (file && (file.size > 1024 * 1024 || !["svg", "png", "webp"].includes(file.name.split(".").at(-1)?.toLowerCase() ?? "") || !["image/svg+xml", "image/png", "image/webp"].includes(file.type))) {
      if (logoInputRef.current) logoInputRef.current.value = "";
      setSelectedFile(""); setMessage("Choose SVG, PNG or WebP within 1 MB. The server also validates logo content."); return;
    }
    setSelectedFile(file?.name ?? "");
  }
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
    <div className="admin-grid admin-grid-brands">
      <div>
        {rows.length === 0 ? (
          <div className="admin-card admin-empty">
            <b>No brands yet.</b>
            <p className="admin-muted" style={{ margin: 0 }}>
              Create the first brand in the panel.
            </p>
          </div>
        ) : (
          <ul aria-label="Brands in display order" className="admin-brand-grid">
              {rows.map((row, index) => (
                <li key={row.id}>
                <article aria-label={row.name} data-selected={draft.id === row.id} className="admin-brand-card">
                  <button type="button" disabled={pending} aria-label={`Edit ${row.name}`} aria-pressed={draft.id === row.id} onClick={() => selectDraft(editBrand(row))} className="admin-brand-card-head">
                    <BrandMark
                      name={row.name}
                      logoUrl={row.logoUrl}
                      accentColor={row.accentColor}
                      size="lg"
                      initialsOnly
                    />
                    <span style={{ minWidth: 0 }}>
                      <b style={{ display: "block", overflowWrap: "anywhere" }}>{row.name}</b>
                      <span className="admin-muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                        /{row.slug} · {sectorLabels[row.sector]}
                      </span>
                    </span>
                  </button>
                  <div className="admin-brand-card-status">
                    <Pill tone={row.status === "active" ? "active" : "inactive"}>
                      {row.status === "active" ? "Active" : "Hidden"}
                    </Pill>
                    {row.status === "active" && !row.description?.trim() && (
                      <span className="admin-pill admin-pill-review">No description</span>
                    )}
                  </div>
                  <details className="admin-brand-card-more"><summary aria-label={`Actions for ${row.name}`}>Brand actions</summary><div className="admin-brand-card-actions">
                    <button
                      className="admin-btn admin-btn-secondary admin-icon-btn"
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
                      className="admin-btn admin-btn-secondary admin-icon-btn"
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
                  </div></details>
                </article>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="admin-card admin-brand-editor">
        <h2 className="admin-kicker" style={{ margin: 0 }}>
          {draft.id ? "Edit brand" : "Create brand"}
        </h2>

        <form
          style={{ marginTop: 12 }}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const element = event.currentTarget;
            void run(async () => {
              const result = await uploadBrandLogoAction(form);
              if (result.ok) { element.reset(); setSelectedFile(""); }
              return result;
            }, "Logo uploaded.");
          }}
        >
          <input type="hidden" name="brandId" value={draft.id ?? ""} />
          <label className="admin-dropzone"
            onDragOver={(event) => { event.preventDefault(); }}
            onDrop={(event) => {
              event.preventDefault();
              if (!draft.id || pending || !logoInputRef.current || !event.dataTransfer.files.length) return;
              const selection = new DataTransfer();
              selection.items.add(event.dataTransfer.files[0]);
              logoInputRef.current.files = selection.files;
              selectLogo(event.dataTransfer.files[0]);
            }}
          >
            {currentLogo && <>
              {/* SVG logos are never inlined; only the persisted validated logo is previewed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentLogo} alt={`${draft.name} logo`} className="admin-logo-preview" />
            </>}
            <span aria-hidden="true">Drop logo here · SVG, PNG or WebP · max 1 MB</span>
            <input
              ref={logoInputRef}
              name="file"
              type="file"
              accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
              required
              disabled={!draft.id || pending}
              aria-label={`Logo for ${draft.name}`}
              onChange={(event) => selectLogo(event.target.files?.[0])}
            />
            {selectedFile && <span className="admin-selected-logo">Selected: {selectedFile}</span>}
          </label>
          {!draft.id && (
            <p className="admin-note" style={{ margin: "6px 0 0" }}>
              Save the brand first, then upload its logo.
            </p>
          )}
          <div style={{ marginTop: 10 }}>
            <button className="admin-btn admin-btn-secondary" disabled={!draft.id || pending}>
              Upload logo
            </button>
          </div>
        </form>

        <form
          style={{ marginTop: 16 }}
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const result = await saveBrandAction(draft);
              if (result.ok) setDraft({ ...draft, id: result.data.id });
              return result;
            }, "Brand saved.");
          }}
        >
          <fieldset disabled={pending} className="admin-fieldset">
          <label>
            Name
            <input
              value={draft.name}
              required
              maxLength={150}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="admin-brand-description">
            <span>Description ({draft.description.length}/3000)</span>
            <textarea aria-label="Description" rows={3} value={draft.description} maxLength={3000} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>
          <details className="admin-brand-settings"><summary>Additional settings</summary>
          <label>
            Slug
            <input
              value={draft.slug}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={120}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            />
          </label>
          <label>
            Sector
            <select
              aria-label="Sector"
              value={draft.sector}
              onChange={(event) =>
                setDraft({ ...draft, sector: event.target.value as BrandInput["sector"] })
              }
            >
              {sectorEnum.enumValues.map((value) => (
                <option key={value} value={value}>
                  {sectorLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Website
            <input
              type="url"
              value={draft.website}
              maxLength={2048}
              placeholder="https://example.com"
              onChange={(event) => setDraft({ ...draft, website: event.target.value })}
            />
          </label>
          <label>
            Accent color
            <input
              value={draft.accentColor}
              pattern="#[0-9a-fA-F]{6}"
              placeholder="#213F6E"
              onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })}
            />
          </label>
          <label>
            Status
            <select aria-label="Status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as BrandInput["status"] })}>
              <option value="active">Active</option><option value="hidden">Hidden</option>
            </select>
          </label>
          </details>
          <section
            aria-label="Accent contrast preview"
            style={{
              marginTop: 12,
              borderRadius: 14,
              padding: 12,
              backgroundColor: previewAccent,
              color: previewText,
            }}
          >
            <b>Sample text on accent</b>
          </section>
          <p className="admin-muted admin-accent-contrast">Contrast {contrastRatio(previewAccent, previewText).toFixed(2)}:1 · readable text</p>
          <div className="admin-filter-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" disabled={pending}>
              {pending ? "Saving…" : "Save brand"}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => selectDraft(blank)}
            >
              New brand
            </button>
          </div>
          </fieldset>
        </form>

        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
      </div>
    </div>
  );
}
