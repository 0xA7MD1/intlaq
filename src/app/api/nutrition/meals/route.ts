import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "node:crypto";
import { and, desc, eq, sql, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { meals } from "@/server/db/schema";
import { CloudinaryUploadError, uploadImageToCloudinary } from "@/server/utils/cloudinary-upload";
import { analyzeMealWithGemini } from "@/server/utils/gemini-meal-analysis";
import { getCustomerCreditsBalance, getUserPolarCustomerId, ingestCreditDelta } from "@/server/utils/polar";
import { revalidateTag } from "next/cache";

function asPositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParseUserInputs(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

function validateUserInputs(inputs: Record<string, unknown>) {
  const fields: Array<[string, number]> = [
    ["mealName", 120],
    ["ingredients", 2000],
    ["userNote", 2000],
  ];
  for (const [key, maxLen] of fields) {
    const v = inputs[key];
    if (typeof v === "string" && v.length > maxLen) {
      throw new Error(`Invalid ${key}`);
    }
  }
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = asPositiveInt(url.searchParams.get("page"), 1);
  const pageSize = clamp(asPositiveInt(url.searchParams.get("pageSize"), 6), 1, 50);
  const offset = (page - 1) * pageSize;
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const conditions = [eq(meals.userId, session.user.id)];

  if (fromParam) {
    const fromDate = new Date(fromParam);
    if (!isNaN(fromDate.getTime())) {
      conditions.push(gte(meals.createdAt, fromDate));
    }
  }

  if (toParam) {
    const toDate = new Date(toParam);
    if (!isNaN(toDate.getTime())) {
      conditions.push(lte(meals.createdAt, toDate));
    }
  }

  const where = and(...conditions);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(meals)
    .where(where);

  const items = await db
    .select({
      id: meals.id,
      imageUrl: meals.imageUrl,
      userInputs: meals.userInputs,
      aiAnalysis: meals.aiAnalysis,
      createdAt: meals.createdAt,
    })
    .from(meals)
    .where(where)
    .orderBy(desc(meals.createdAt))
    .limit(pageSize)
    .offset(offset);

  const normalized = items.map((m) => ({
    id: m.id,
    imageUrl: m.imageUrl,
    userInputs: (m.userInputs ?? {}) as Record<string, unknown>,
    aiAnalysis: (m.aiAnalysis ?? {}) as Record<string, unknown>,
    createdAt: m.createdAt?.toISOString?.() ?? String(m.createdAt),
  }));

  return NextResponse.json({
    items: normalized,
    page,
    pageSize,
    totalCount: Number(count ?? 0),
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const polarCustomerId = await getUserPolarCustomerId(session.user.id);
    if (!polarCustomerId) {
      return NextResponse.json(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }

    const balance = await getCustomerCreditsBalance(polarCustomerId);
    if (!Number.isFinite(balance) || balance <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }

    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }
    if (typeof file.type !== "string" || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    if (typeof file.size === "number" && file.size <= 0) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const userInputs = safeParseUserInputs(form.get("user_inputs"));
    validateUserInputs(userInputs);

    const uploaded = await uploadImageToCloudinary({
      file,
      folder: `intlaq/meals/${session.user.id}`,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const gemini = await analyzeMealWithGemini({
      imageBase64: base64,
      mimeType: file.type,
      userInputs: {
        ...userInputs,
        imageUrl: uploaded.secure_url,
      },
    });

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(meals).values({
      id,
      userId: session.user.id,
      imageUrl: uploaded.secure_url,
      userInputs: userInputs as Record<string, unknown>,
      aiAnalysis: gemini as Record<string, unknown>,
      createdAt: now,
    });

    try {
      await ingestCreditDelta({
        customerId: polarCustomerId,
        units: 1,
        externalId: `meal:${id}:consume`,
        description: "AI meal analysis",
      });
    } catch (e) {
      console.error("Polar credit deduction failed", {
        userId: session.user.id,
        customerId: polarCustomerId,
        mealId: id,
        message: e instanceof Error ? e.message : String(e),
      });
    }

    revalidateTag(`dashboard-stats-${session.user.id}`, "default");

    return NextResponse.json({
      id,
      userId: session.user.id,
      imageUrl: uploaded.secure_url,
      userInputs,
      aiAnalysis: gemini,
      createdAt: now.toISOString(),
    });
  } catch (e) {
    if (e instanceof CloudinaryUploadError) {
      console.error("Cloudinary upload error", {
        code: e.code,
        status: e.status,
        driftSeconds: e.driftSeconds,
        message: e.message,
      });

      const status = e.code === "invalid_request" ? 400 : e.code === "stale_request" ? 503 : 502;
      const hint =
        e.code === "stale_request"
          ? "Cloudinary rejected the request due to clock drift. Please sync server time and retry."
          : undefined;
      return NextResponse.json(
        { error: e.message || "Cloudinary upload failed", code: e.code, hint },
        { status },
      );
    }

    console.error("Nutrition meal POST failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

