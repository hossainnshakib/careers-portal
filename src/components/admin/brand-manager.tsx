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

export function BrandManager({ rows }: { rows: Brand[] }) {
  const [draft, setDraft] = useState<BrandInput>(blank);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
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
          <div role="table" aria-label="Brands in display order">
            <div role="rowgroup" className="admin-brand-grid">
              {rows.map((row, index) => (
                <div key={row.id} role="row" className="admin-brand-card">
                  <div role="cell" className="admin-brand-card-head">
                    <BrandMark
                      name={row.name}
                      logoUrl={row.logoUrl}
                      accentColor={row.accentColor}
                      size="lg"
                      alt={`${row.name} logo`}
                    />
                    <div style={{ minWidth: 0 }}>
                      <b style={{ display: "block", overflowWrap: "anywhere" }}>{row.name}</b>
                      <span className="admin-muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>
                        /{row.slug} · {sectorLabels[row.sector]}
                      </span>
                    </div>
                  </div>
                  <div role="cell" className="admin-brand-card-status">
                    <Pill tone={row.status === "active" ? "active" : "inactive"}>
                      {row.status === "active" ? "Active" : "Hidden"}
                    </Pill>
                  </div>
                  <div role="cell" className="admin-brand-card-flags">
                    {row.status === "active" && !row.description?.trim() && (
                      <span className="admin-pill admin-pill-review">No description</span>
                    )}
                  </div>
                  <div role="cell" className="admin-brand-card-actions">
                    <button
                      className="admin-btn admin-btn-secondary admin-btn-sm"
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
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
              if (result.ok) element.reset();
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
            }}
          >
            <span aria-hidden="true">Drop logo here · SVG, PNG or WebP · max 1 MB</span>
            <input
              ref={logoInputRef}
              name="file"
              type="file"
              accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
              required
              disabled={!draft.id || pending}
              aria-label={`Logo for ${draft.name}`}
            />
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
          <label>
            Name
            <input
              value={draft.name}
              required
              maxLength={150}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
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
            Description
            <textarea
              aria-label="Description"
              value={draft.description}
              maxLength={3000}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
            <span className="admin-note" style={{ textAlign: "right" }}>
              {draft.description.length}/3000
            </span>
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
            <b>{draft.name || "Brand colour preview"}</b>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              Readable text · {contrastRatio(previewAccent, previewText).toFixed(2)}:1 contrast
            </p>
          </section>
          <label>
            Status
            <select
              aria-label="Status"
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as BrandInput["status"] })
              }
            >
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <div className="admin-filter-actions" style={{ marginTop: 14 }}>
            <button className="admin-btn" disabled={pending}>
              {pending ? "Saving…" : "Save brand"}
            </button>
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              disabled={pending}
              onClick={() => setDraft(blank)}
            >
              New brand
            </button>
          </div>
        </form>

        <p role="status" aria-live="polite" className="admin-error">
          {message}
        </p>
      </div>
    </div>
  );
}
