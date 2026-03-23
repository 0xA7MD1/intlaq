import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CloudinaryUploadError, uploadImageToCloudinary } from "./cloudinary-upload";

function makeHeaders(map: Record<string, string>) {
  return {
    get: (k: string) => {
      const key = Object.keys(map).find((x) => x.toLowerCase() === k.toLowerCase());
      return key ? map[key] : null;
    },
  };
}

describe("uploadImageToCloudinary", () => {
  const originalEnv = process.env.CLOUDINARY_URL;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.CLOUDINARY_URL = "cloudinary://test_key:test_secret@test_cloud";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.CLOUDINARY_URL = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("uses Cloudinary time drift to avoid stale timestamp", async () => {
    const now = new Date("2026-01-21T20:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const headDate = "Wed, 21 Jan 2026 22:00:00 GMT";
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://api.cloudinary.com" && init?.method === "HEAD") {
        return { ok: true, status: 200, headers: makeHeaders({ date: headDate }) } as unknown as Response;
      }
      if (url.includes("api.cloudinary.com/v1_1/test_cloud/image/upload")) {
        const body = init?.body as FormData;
        const ts = body.get("timestamp");
        expect(ts).toBe(String(Math.floor(now / 1000) + 2 * 60 * 60));
        return {
          ok: true,
          status: 200,
          json: async () => ({ secure_url: "https://res.cloudinary.com/test_cloud/image/upload/x.jpg" }),
        } as unknown as Response;
      }
      throw new Error("Unexpected fetch");
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const file = new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" });
    const out = await uploadImageToCloudinary({ file, folder: "intlaq/meals/u1" });
    expect(out.secure_url).toContain("res.cloudinary.com");
  });

  it("retries once on stale request and then succeeds", async () => {
    const now = new Date("2026-01-21T20:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockImplementation(() => now);

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://api.cloudinary.com" && init?.method === "HEAD") {
        return { ok: true, status: 200, headers: makeHeaders({ date: "Wed, 21 Jan 2026 20:00:00 GMT" }) } as unknown as Response;
      }
      if (url.includes("api.cloudinary.com/v1_1/test_cloud/image/upload")) {
        if (fetchMock.mock.calls.filter((c) => String(c[0]).includes("/image/upload")).length === 1) {
          return {
            ok: false,
            status: 400,
            text: async () =>
              JSON.stringify({
                error: { message: "Stale request - reported time is 2026-01-21 18:00:00 +0000 which is more than 1 hour ago" },
              }),
          } as unknown as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ secure_url: "https://res.cloudinary.com/test_cloud/image/upload/y.jpg" }),
        } as unknown as Response;
      }
      throw new Error("Unexpected fetch");
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const file = new File([new Uint8Array([1])], "y.jpg", { type: "image/jpeg" });
    const out = await uploadImageToCloudinary({ file });
    expect(out.secure_url).toContain("/y.jpg");
  });

  it("throws CloudinaryUploadError on invalid folder", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    const file = new File([new Uint8Array([1])], "z.jpg", { type: "image/jpeg" });
    await expect(uploadImageToCloudinary({ file, folder: "../bad" })).rejects.toBeInstanceOf(
      CloudinaryUploadError,
    );
  });
});

