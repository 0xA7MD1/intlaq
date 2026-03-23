import { NextResponse, type NextRequest } from "next/server";
import { consumeFixedWindow } from "@/lib/rate-limit";

const store = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

function getClientIdentity(req: NextRequest) {
  const ip = getClientIp(req);
  const cookies = req.cookies.getAll();
  const sessionLike = cookies.find(
    (c) => c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("token"),
  );

  const sig = sessionLike?.value ? sessionLike.value.slice(0, 16) : "anon";
  return `${ip}:${sig}`;
}

export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith("/api/");
  const isServerAction = req.method === "POST" && req.headers.has("next-action");

  if (!isApi && !isServerAction) return NextResponse.next();

  const client = getClientIdentity(req);
  const bucket = isServerAction ? "actions" : "api";
  const key = `${bucket}:${client}`;

  const limitPerMinute = isServerAction
    ? Number(process.env.RATE_LIMIT_ACTIONS_PER_MINUTE ?? 30)
    : Number(process.env.RATE_LIMIT_API_PER_MINUTE ?? 60);

  const windowMs = 60_000;
  const limit = Number.isFinite(limitPerMinute) && limitPerMinute > 0 ? limitPerMinute : 30;

  const result = consumeFixedWindow({ store, key, limit, windowMs });

  if (!result.allowed) {
    console.warn("rate_limit_block", {
      bucket,
      path: req.nextUrl.pathname,
      retryAfterSeconds: result.retryAfterSeconds,
    });

    const res = NextResponse.json(
      {
        error: "Too Many Requests",
        retryAfterSeconds: result.retryAfterSeconds,
      },
      { status: 429 },
    );

    res.headers.set("Retry-After", String(result.retryAfterSeconds));
    res.headers.set("X-RateLimit-Limit", String(result.limit));
    res.headers.set("X-RateLimit-Remaining", String(result.remaining));
    res.headers.set("X-RateLimit-Reset", String(result.resetAt));
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset", String(result.resetAt));
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/:path*"],
};
