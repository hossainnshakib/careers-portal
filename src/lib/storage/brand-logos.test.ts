import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({ getStorageClient: () => ({ from: () => ({ upload: mocks.upload, getPublicUrl: () => ({ data: { publicUrl: "https://storage.example.test/logo" } }) }) }) }));
import { uploadBrandLogo } from "./brand-logos";
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => { mocks.upload.mockReset(); mocks.upload.mockResolvedValue({ error: null }); });
it("rejects header-shaped PNGs and oversized SVG canvases before storing anything", async () => {
  const bytes = new Uint8Array(24); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]); bytes.set(new TextEncoder().encode("IHDR"), 12);
  await expect(uploadBrandLogo(id, new File([bytes], "logo.png", { type: "image/png" }))).rejects.toThrow();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100000" height="100000"><rect width="10" height="10"/></svg>';
  await expect(uploadBrandLogo(id, new File([svg], "logo.svg", { type: "image/svg+xml" }))).rejects.toThrow();
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("accepts an actual decoded image under a server-generated path", async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: "#ffffff" } }).png().toBuffer();
  const result = await uploadBrandLogo(id, new File([new Uint8Array(png)], "logo.png", { type: "image/png" }));
  expect(result.path).toMatch(/^brands\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/);
  expect(mocks.upload).toHaveBeenCalledOnce();
});
