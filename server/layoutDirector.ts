import type { IncomingMessage, ServerResponse } from "node:http";

type LayoutRole = "background" | "logo" | "headline" | "text" | "cta" | "legal" | "image" | "icon" | "ui";

export type LayoutElementInput = {
  id: string;
  role: LayoutRole;
  kind: string;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  scale: number;
  fontSize: number;
  lineHeight: number;
  visible: boolean;
};

export type LayoutAssetInput = {
  id: string;
  name: string;
  width: number;
  height: number;
  bytes: number;
  previewDataUrl?: string;
};

export type LayoutDirectorRequest = {
  phase?: "plan" | "review";
  master: { width: number; height: number; elements: LayoutElementInput[]; previewDataUrl?: string };
  target: { id: string; width: number; height: number; elements: LayoutElementInput[]; previewDataUrl?: string };
  assets?: LayoutAssetInput[];
};

const geminiSchema = {
  type: "OBJECT",
  properties: {
    rationale: { type: "STRING" },
    elements: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" }, dx: { type: "NUMBER" }, dy: { type: "NUMBER" }, dWidth: { type: "NUMBER" },
          dScale: { type: "NUMBER" }, dFontSize: { type: "NUMBER" },
        },
        required: ["id", "dx", "dy", "dWidth", "dScale", "dFontSize"],
      },
    },
  },
  required: ["rationale", "elements"],
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const finiteDelta = (value: unknown, limit: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, -limit, limit) : 0;
};

export function sanitize(result: any, request: LayoutDirectorRequest) {
  const allowed = new Map(request.target.elements.map((e) => [e.id, e]));
  return {
    rationale: typeof result?.rationale === "string" ? result.rationale.slice(0, 900) : "AI layout",
    elements: Array.isArray(result?.elements)
      ? result.elements.filter((item: any) => allowed.has(item?.id)).map((item: any) => {
          return {
            id: item.id,
            dx: finiteDelta(item.dx, 8),
            dy: finiteDelta(item.dy, 8),
            dWidth: finiteDelta(item.dWidth, 10),
            dScale: finiteDelta(item.dScale, 10),
            dFontSize: finiteDelta(item.dFontSize, 6),
          };
        }) : [],
  };
}

function parseModelJson(text: string) {
  const trimmed = text.trim();
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(unfenced); } catch {}
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(unfenced.slice(start, end + 1)); } catch {}
  }
  throw new Error(`AI returned text but no valid layout JSON. Preview: ${unfenced.slice(0, 180)}`);
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 12_000_000) throw new Error("Request too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function payloadWithoutImages(payload: LayoutDirectorRequest) {
  return {
    phase: payload.phase ?? "plan",
    master: { width: payload.master.width, height: payload.master.height, elements: payload.master.elements },
    target: { id: payload.target.id, width: payload.target.width, height: payload.target.height, elements: payload.target.elements },
    assets: (payload.assets ?? []).map(({ previewDataUrl: _previewDataUrl, ...asset }) => asset),
  };
}

export function buildPrompt(payload: LayoutDirectorRequest) {
  return `You are a visual QA art director for an HTML5 banner resize.
The first image is the MASTER reference. The second image is a rough deterministic TARGET draft at ${payload.target.width}x${payload.target.height}.
Inspect the draft and provide ONLY relative DELTAS to fix visible composition failures.
Return ONLY one valid JSON object.
JSON SHAPE: {"rationale":"string","elements":[{"id":"existing id","dx":0,"dy":0,"dWidth":0,"dScale":0,"dFontSize":0}]}

RULES:
- dx/dy are percentage points of the target width/height.
- dWidth/dScale are percentage points.
- dFontSize is real pixels.
- Return 0 for elements that look fine. Do not invent new positions or restructure the whole layout.
- Make small, surgical corrections (do not propose huge jumps).
- Every returned element id must correspond to an input element.
- This is ${payload.phase === "review" ? "the final visual review pass" : "the first correction pass"}; preserve the deterministic anchor.

STRUCTURE:
${JSON.stringify(payloadWithoutImages(payload))}`;
}

function openRouterContent(payload: LayoutDirectorRequest) {
  const content: any[] = [{ type: "text", text: buildPrompt(payload) }];
  if (payload.master.previewDataUrl) content.push({ type: "image_url", image_url: { url: payload.master.previewDataUrl } });
  if (payload.target.previewDataUrl) content.push({ type: "image_url", image_url: { url: payload.target.previewDataUrl } });
  for (const asset of payload.assets ?? []) if (asset.previewDataUrl) content.push({ type: "image_url", image_url: { url: asset.previewDataUrl } });
  return content;
}

function openRouterError(body: any, status: number) {
  const message = body?.error?.message || body?.message || "Unknown upstream error";
  const code = body?.error?.code ?? body?.code;
  const metadata = body?.error?.metadata;
  const provider = metadata?.provider_name || metadata?.provider || body?.provider;
  const parts = [`OpenRouter ${status}`];
  if (code !== undefined) parts.push(`code=${String(code)}`);
  if (provider) parts.push(`provider=${String(provider)}`);
  parts.push(String(message));
  return parts.join(" · ");
}

async function runOpenRouter(payload: LayoutDirectorRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured on the server");
  const model = process.env.OPENROUTER_LAYOUT_MODEL || "google/gemini-2.0-flash-001";
  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://banners.rechord.online",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Banner Editor Layout Director",
      },
      body: JSON.stringify({
        models: [model, "openai/gpt-4o-mini"],
        messages: [{ role: "user", content: openRouterContent(payload) }],
        temperature: 0.1,
        max_tokens: 800,
        reasoning: { effort: "low", exclude: true },
      }),
      signal: AbortSignal.timeout(150_000),
    });
  } catch (error) {
    throw new Error(`OpenRouter network error · ${error instanceof Error ? error.message : String(error)}`);
  }

  const raw = await response.text();
  let body: any = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = { message: raw.slice(0, 500) }; }
  if (!response.ok) throw new Error(openRouterError(body, response.status));

  const content = body?.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: any) => typeof part?.text === "string" ? part.text : "").join("")
      : "";
  if (!text) {
    const finishReason = body?.choices?.[0]?.finish_reason;
    throw new Error(`OpenRouter returned an empty layout${finishReason ? ` · finish_reason=${finishReason}` : ""}`);
  }
  return {...sanitize(parseModelJson(text), payload),model:String(body?.model||model),provider:String(body?.provider||body?.choices?.[0]?.provider||"OpenRouter"),usage:body?.usage};
}

async function runGemini(payload: LayoutDirectorRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");
  const model = process.env.GEMINI_LAYOUT_MODEL || "gemini-2.5-flash-lite";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 800, responseMimeType: "application/json", responseSchema: geminiSchema },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status})`);
  const text = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned an empty layout");
  return sanitize(parseModelJson(text), payload);
}

export async function runLayoutDirector(payload: LayoutDirectorRequest) {
  if (process.env.OPENROUTER_API_KEY) return runOpenRouter(payload);
  if (process.env.GEMINI_API_KEY) return runGemini(payload);
  throw new Error("No AI provider configured. Add OPENROUTER_API_KEY (recommended) or GEMINI_API_KEY.");
}

export function layoutDirectorMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith("/api/layout-director")) return next();
    if (req.method === "GET" && req.url.startsWith("/api/layout-director/status")) {
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ provider: process.env.OPENROUTER_API_KEY ? "OpenRouter" : process.env.GEMINI_API_KEY ? "Gemini" : "none", model: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_LAYOUT_MODEL || "google/gemini-2.0-flash-001" : process.env.GEMINI_LAYOUT_MODEL || "gemini-2.5-flash-lite", configured: Boolean(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY) }));
      return;
    }
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    try {
      const payload = (await readJson(req)) as LayoutDirectorRequest;
      const result = await runLayoutDirector(payload);
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Layout Director failed";
      console.error(`[layout-director] ${message}`);
      res.statusCode = /API_KEY|No AI provider/.test(message) ? 503 : 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  };
}
