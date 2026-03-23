import crypto from "node:crypto";

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryUploadErrorCode = "stale_request" | "invalid_request" | "upload_failed";

type CloudinaryErrorResponse = {
  error?: {
    message?: string;
  };
};

export class CloudinaryUploadError extends Error {
  code: CloudinaryUploadErrorCode;
  status: number;
  details?: unknown;
  driftSeconds?: number;

  constructor(args: {
    code: CloudinaryUploadErrorCode;
    message: string;
    status: number;
    details?: unknown;
    driftSeconds?: number;
  }) {
    super(args.message);
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
    this.driftSeconds = args.driftSeconds;
  }
}

function parseCloudinaryUrl(url: string): CloudinaryCredentials {
  const u = new URL(url);
  if (u.protocol !== "cloudinary:") throw new Error("Invalid CLOUDINARY_URL");
  const apiKey = decodeURIComponent(u.username);
  const apiSecret = decodeURIComponent(u.password);
  const cloudName = u.hostname;
  if (!apiKey || !apiSecret || !cloudName) throw new Error("Invalid CLOUDINARY_URL");
  return { cloudName, apiKey, apiSecret };
}

function isSafeCloudinaryFolder(folder: string) {
  if (!folder) return true;
  if (folder.length > 512) return false;
  return /^[a-zA-Z0-9/_-]+$/.test(folder);
}

function signCloudinaryUpload(args: {
  apiSecret: string;
  timestamp: number;
  folder?: string;
}) {
  const parts: string[] = [];
  if (args.folder) parts.push(`folder=${args.folder}`);
  parts.push(`timestamp=${args.timestamp}`);
  const toSign = `${parts.join("&")}${args.apiSecret}`;
  return crypto.createHash("sha1").update(toSign).digest("hex");
}

let cloudinaryTimeCache:
  | {
      at: number;
      driftSeconds: number;
    }
  | undefined;

async function getCloudinaryTimeDriftSeconds(args?: { forceRefresh?: boolean }) {
  const forceRefresh = Boolean(args?.forceRefresh);
  const now = Date.now();
  if (!forceRefresh && cloudinaryTimeCache && now - cloudinaryTimeCache.at < 10 * 60 * 1000) {
    return cloudinaryTimeCache.driftSeconds;
  }

  const start = Date.now();
  const res = await fetch("https://api.cloudinary.com", { method: "HEAD" }).catch(() => null);
  const end = Date.now();
  const dateHeader = res?.headers?.get?.("date") ?? null;
  if (!dateHeader) return null;

  const serverMs = new Date(dateHeader).getTime();
  if (!Number.isFinite(serverMs)) return null;

  const serverUnix = Math.floor(serverMs / 1000);
  const localMidUnix = Math.floor(((start + end) / 2) / 1000);
  const driftSeconds = serverUnix - localMidUnix;

  cloudinaryTimeCache = { at: now, driftSeconds };
  if (Math.abs(driftSeconds) >= 60) {
    console.warn("Cloudinary time drift detected", { driftSeconds });
  }
  return driftSeconds;
}

function parseCloudinaryErrorText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return { message: "", details: undefined as unknown };
  try {
    const json = JSON.parse(trimmed) as CloudinaryErrorResponse;
    const msg = typeof json?.error?.message === "string" ? json.error.message : trimmed;
    return { message: msg, details: json as unknown };
  } catch {
    return { message: trimmed, details: undefined as unknown };
  }
}

export async function uploadImageToCloudinary(args: {
  file: File;
  folder?: string;
  maxBytes?: number;
}) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) throw new Error("Missing CLOUDINARY_URL");
  const { cloudName, apiKey, apiSecret } = parseCloudinaryUrl(cloudinaryUrl);

  if (!args.file || typeof args.file.size !== "number") {
    throw new CloudinaryUploadError({
      code: "invalid_request",
      status: 400,
      message: "Invalid image file",
    });
  }
  if (typeof args.file.type === "string" && !args.file.type.startsWith("image/")) {
    throw new CloudinaryUploadError({
      code: "invalid_request",
      status: 400,
      message: "Invalid image type",
    });
  }
  if (args.folder && !isSafeCloudinaryFolder(args.folder)) {
    throw new CloudinaryUploadError({
      code: "invalid_request",
      status: 400,
      message: "Invalid upload folder",
    });
  }

  const maxBytes = args.maxBytes ?? 8 * 1024 * 1024;
  if (args.file.size > maxBytes) {
    throw new CloudinaryUploadError({
      code: "invalid_request",
      status: 413,
      message: "Image too large",
    });
  }

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  async function uploadOnce(timestamp: number) {
    const signature = signCloudinaryUpload({
      apiSecret,
      timestamp,
      folder: args.folder,
    });

    const form = new FormData();
    form.set("file", args.file);
    form.set("api_key", apiKey);
    form.set("timestamp", String(timestamp));
    if (args.folder) form.set("folder", args.folder);
    form.set("signature", signature);

    const res = await fetch(uploadEndpoint, {
      method: "POST",
      body: form,
    });
    return res;
  }

  const driftSeconds = (await getCloudinaryTimeDriftSeconds()) ?? 0;
  const timestamp = Math.floor(Date.now() / 1000) + driftSeconds;

  let res = await uploadOnce(timestamp);
  let txt = res.ok ? "" : await res.text().catch(() => "");
  if (!res.ok) {
    const parsed = parseCloudinaryErrorText(txt);
    const combined = `${parsed.message}\n${txt}`.toLowerCase();
    const isStale =
      combined.includes("stale request") ||
      combined.includes("stale_request") ||
      (combined.includes("stale") && combined.includes("reported time"));
    if (isStale) {
      const drift2 = await getCloudinaryTimeDriftSeconds({ forceRefresh: true });
      if (typeof drift2 === "number") {
        const timestamp2 = Math.floor(Date.now() / 1000) + drift2;
        res = await uploadOnce(timestamp2);
        txt = res.ok ? "" : await res.text().catch(() => "");
        if (!res.ok) {
          const parsed2 = parseCloudinaryErrorText(txt);
          throw new CloudinaryUploadError({
            code: "stale_request",
            status: res.status,
            message: parsed2.message || `Cloudinary upload failed (${res.status})`,
            details: parsed2.details,
            driftSeconds: drift2,
          });
        }
      } else {
        throw new CloudinaryUploadError({
          code: "stale_request",
          status: res.status,
          message: parsed.message || `Cloudinary upload failed (${res.status})`,
          details: parsed.details,
          driftSeconds,
        });
      }
    }

    if (!res.ok) {
      throw new CloudinaryUploadError({
        code: "upload_failed",
        status: res.status,
        message: parsed.message || `Cloudinary upload failed (${res.status})`,
        details: parsed.details,
        driftSeconds,
      });
    }
  }

  const json = (await res.json()) as Record<string, unknown>;
  const secureUrl = typeof json.secure_url === "string" ? json.secure_url : null;
  if (!secureUrl) {
    throw new CloudinaryUploadError({
      code: "upload_failed",
      status: 502,
      message: "Cloudinary response missing secure_url",
      details: json,
    });
  }
  return {
    secure_url: secureUrl,
    public_id: typeof json.public_id === "string" ? json.public_id : undefined,
    bytes: typeof json.bytes === "number" ? json.bytes : undefined,
    width: typeof json.width === "number" ? json.width : undefined,
    height: typeof json.height === "number" ? json.height : undefined,
    format: typeof json.format === "string" ? json.format : undefined,
  };
}

