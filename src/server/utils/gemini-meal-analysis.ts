type GeminiAnalyzeArgs = {
  imageBase64: string;
  mimeType: string;
  userInputs: Record<string, unknown>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiModelInfo = {
  name?: string;
  supportedGenerationMethods?: string[];
  supported_generation_methods?: string[];
};

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Missing Gemini API key");
  return key;
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
}

function getGeminiApiVersion() {
  return (process.env.GEMINI_API_VERSION || "v1").trim();
}

function normalizeModelId(model: string) {
  const trimmed = model.trim();
  return trimmed.startsWith("models/") ? trimmed.slice("models/".length) : trimmed;
}

let modelsCache:
  | {
      at: number;
      models: string[];
    }
  | undefined;

async function listModels(args: { key: string; version: string }): Promise<string[]> {
  const now = Date.now();
  if (modelsCache && now - modelsCache.at < 5 * 60 * 1000) return modelsCache.models;

  const url = `https://generativelanguage.googleapis.com/${args.version}/models?key=${encodeURIComponent(args.key)}`;
  const res = await fetch(url, { method: "GET" });
  const text = await res.text().catch(() => "");
  if (!res.ok) return [];

  const json = JSON.parse(text) as { models?: GeminiModelInfo[] };
  const models =
    json.models
      ?.filter((m) => {
        const methods = m.supportedGenerationMethods ?? m.supported_generation_methods ?? [];
        return Array.isArray(methods) && methods.includes("generateContent");
      })
      .map((m) => (typeof m.name === "string" ? normalizeModelId(m.name) : ""))
      .filter(Boolean) ?? [];

  modelsCache = { at: now, models };
  return models;
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const s = v.trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function pickBestModel(models: string[]) {
  const preferred = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ];
  const set = new Set(models);
  for (const p of preferred) if (set.has(p)) return p;
  return models[0] ?? null;
}

function stripJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
    return withoutFence.trim();
  }
  return trimmed;
}

export async function analyzeMealWithGemini(args: GeminiAnalyzeArgs) {
  const key = getGeminiKey();
  const version = getGeminiApiVersion();
  const baseModel = normalizeModelId(getGeminiModel());

  const prompt =
    "أنت محلل تغذية. حلّل صورة الوجبة وأعد نتيجة بصيغة JSON فقط بدون شرح. " +
    "مفاتيح JSON المطلوبة: name (string), calories (number), protein (number), carbs (number), fat (number), ingredients (string[]), notes (string), confidence (number 0-1). " +
    "استخدم العربية في name/notes إذا أمكن. " +
    "ضع أرقام الماكروز بالغرام.";

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { text: `مدخلات المستخدم (قد تكون فارغة): ${JSON.stringify(args.userInputs)}` },
          {
            inlineData: {
              mimeType: args.mimeType,
              data: args.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  async function callWithModel(model: string): Promise<
    | { ok: true; json: GeminiResponse; model: string }
    | { ok: false; status: number; text: string; model: string }
  > {
    const modelId = normalizeModelId(model);
    const url =
      `https://generativelanguage.googleapis.com/${version}` +
      `/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) return { ok: false, status: res.status, text, model };
    return { ok: true, json: JSON.parse(text) as GeminiResponse, model };
  }

  const candidatesToTry = uniqueStrings([
    baseModel,
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ]);

  let json: GeminiResponse | null = null;
  let lastFailure: { status: number; text: string; model: string } | null = null;

  for (const model of candidatesToTry) {
    const result = await callWithModel(model);
    if (result.ok) {
      json = result.json;
      lastFailure = null;
      break;
    }
    lastFailure = { status: result.status, text: result.text, model: result.model };
    if (result.status === 404) continue;
    throw new Error(`Gemini request failed (${result.status}): ${result.text}`);
  }

  if (!json) {
    const available = await listModels({ key, version });
    const best = pickBestModel(available);
    if (best) {
      const retry = await callWithModel(best);
      if (retry.ok) {
        json = retry.json;
      } else {
        lastFailure = { status: retry.status, text: retry.text, model: retry.model };
      }
    }
  }

  if (!json) {
    const available = await listModels({ key, version });
    const hint = available.length ? ` Available models: ${available.slice(0, 10).join(", ")}` : "";
    throw new Error(
      `Gemini request failed (${lastFailure?.status ?? "unknown"}): ${lastFailure?.text ?? ""}${hint}`,
    );
  }

  const text =
    json.candidates?.[0]?.content?.parts
      ?.map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("\n") ??
    "";

  const parsedText = stripJson(text);
  try {
    return { raw: json as unknown, parsed: JSON.parse(parsedText) as Record<string, unknown> };
  } catch {
    return { raw: json as unknown, parsed: { text: parsedText } as Record<string, unknown> };
  }
}

