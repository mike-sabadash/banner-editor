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

export type LayoutDirectorRequest = {
  master: { width: number; height: number; elements: LayoutElementInput[]; previewDataUrl?: string };
  target: { id: string; width: number; height: number; elements: LayoutElementInput[]; previewDataUrl?: string };
};

const openAiSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rationale: { type: "string" },
    elements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" }, x: { type: "number" }, y: { type: "number" }, width: { type: "number" },
          scale: { type: "number" }, fontSize: { type: "number" }, visible: { type: "boolean" },
        },
        required: ["id", "x", "y", "width", "scale", "fontSize", "visible"],
      },
    },
  },
  required: ["rationale", "elements"],
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
          id: { type: "STRING" }, x: { type: "NUMBER" }, y: { type: "NUMBER" }, width: { type: "NUMBER" },
          scale: { type: "NUMBER" }, fontSize: { type: "NUMBER" }, visible: { type: "BOOLEAN" },
        },
        required: ["id", "x", "y", "width", "scale", "fontSize", "visible"],
      },
    },
  },
  required: ["rationale", "elements"],
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const textFontMax = (role: LayoutRole, width: number, height: number) => {
  if (role === "headline") return clamp(Math.min(width * 0.12, height * 0.22), 11, 58);
  if (role === "legal") return clamp(Math.min(width * 0.045, height * 0.07), 6, 16);
  return clamp(Math.min(width * 0.075, height * 0.11), 7, 30);
};

function sanitize(result: any, request: LayoutDirectorRequest) {
  const allowed = new Map(request.target.elements.map((e) => [e.id, e]));
  return {
    rationale: typeof result?.rationale === "string" ? result.rationale.slice(0, 900) : "AI layout",
    elements: Array.isArray(result?.elements)
      ? result.elements.filter((item: any) => allowed.has(item?.id)).map((item: any) => {
          const original = allowed.get(item.id)!;
          const background = original.role === "background";
          const image = ["background", "logo", "image", "icon", "ui"].includes(original.role);
          const text = !image;
          return {
            id: item.id,
            x: clamp(Number(item.x ?? original.x), background ? -400 : 1, background ? 200 : 97),
            y: clamp(Number(item.y ?? original.y), background ? -400 : 1, background ? 200 : 97),
            width: clamp(Number(item.width ?? original.width), background ? 20 : 2, background ? 400 : 94),
            // Text size is controlled only by fontSize. Keeping text scale at 100 avoids double-scaling in Konva.
            scale: text ? 100 : clamp(Number(item.scale ?? original.scale), 10, background ? 900 : 160),
            fontSize: image ? original.fontSize : clamp(Number(item.fontSize ?? original.fontSize), 6, textFontMax(original.role, request.target.width, request.target.height)),
            visible: typeof item.visible === "boolean" ? item.visible : original.visible,
          };
        }) : [],
  };
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 4_000_000) throw new Error("Request too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function payloadWithoutImages(payload: LayoutDirectorRequest) {
  return {
    master: { width: payload.master.width, height: payload.master.height, elements: payload.master.elements },
    target: { id: payload.target.id, width: payload.target.width, height: payload.target.height, elements: payload.target.elements },
  };
}

function buildPrompt(payload: LayoutDirectorRequest) {
  const ratio = payload.target.width / payload.target.height;
  const formatHint = ratio >= 4 ? "extreme horizontal strip" : ratio < 0.8 ? "portrait / vertical" : "rectangle";
  return `You are the responsive art director for an HTML5 banner campaign. The first image is the MASTER composition. The second image is a rough deterministic TARGET resize. Recompose the TARGET as a designer would; do not merely scale the master. Target is ${payload.target.width}x${payload.target.height} (${formatHint}). Return only the requested structured JSON.\n\nMANDATORY QUALITY RULES:\n- Preserve the same campaign, copy, assets, ids, visual hierarchy and recognizable brand intent.\n- No accidental overlaps. No clipped headline. No empty white/unpainted artboard. No giant typography that destroys hierarchy.\n- Background must COVER the entire target. Cropping is expected. x/y may be strongly negative for background crop. Preserve visually useful parts of the master background when possible.\n- Treat logo as a logo: smaller than headline, protected by safe margins, never stretched across the layout.\n- Treat icon/badge as attached supporting content near its related text, not as a hero image.\n- Treat ui/image panels as independent composition blocks: resize and reposition them deliberately.\n- Headline may wrap to more or fewer lines by changing width and fontSize. On portrait, build a vertical hierarchy. On strips, aggressively compact into a horizontal hierarchy.\n- Secondary copy must remain visually secondary.\n- Keep ordinary foreground content roughly inside 4% safe margins.\n- Values x/y/width are percentages of TARGET artboard. fontSize is real TARGET pixels.\n- CRITICAL: for ALL text elements return scale=100. Never use scale to resize text; use fontSize and width only.\n- For logo/icon/ui images prefer scale around 100 and resize mainly with width. Do not make logos or badges huge.\n- Study the MASTER screenshot for grouping, alignment, proximity, focal balance and whitespace. Use the rough TARGET screenshot only as a starting point and fix its failures.\n- Every returned element id must correspond to an input element. Do not invent or rename assets.\n\nSTRUCTURE:\n${JSON.stringify(payloadWithoutImages(payload))}`;
}

function openRouterContent(payload: LayoutDirectorRequest) {
  const content: any[] = [{ type: "text", text: buildPrompt(payload) }];
  if (payload.master.previewDataUrl) content.push({ type: "image_url", image_url: { url: payload.master.previewDataUrl } });
  if (payload.target.previewDataUrl) content.push({ type: "image_url", image_url: { url: payload.target.previewDataUrl } });
  return content;
}

async function runOpenRouter(payload: LayoutDirectorRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured on the server");
  const model = process.env.OPENROUTER_LAYOUT_MODEL || "openrouter/free";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://banners.rechord.online",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Banner Editor Layout Director",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: openRouterContent(payload) }],
      temperature: 0.12,
      response_format: { type: "json_schema", json_schema: { name: "banner_layout", strict: true, schema: openAiSchema } },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `OpenRouter vision request failed (${response.status})`);
  const text = body?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("OpenRouter returned an empty layout");
  return sanitize(JSON.parse(text), payload);
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
      generationConfig: { temperature: 0.12, responseMimeType: "application/json", responseSchema: geminiSchema },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status})`);
  const text = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned an empty layout");
  return sanitize(JSON.parse(text), payload);
}

export async function runLayoutDirector(payload: LayoutDirectorRequest) {
  if (process.env.OPENROUTER_API_KEY) return runOpenRouter(payload);
  if (process.env.GEMINI_API_KEY) return runGemini(payload);
  throw new Error("No AI provider configured. Add OPENROUTER_API_KEY (recommended) or GEMINI_API_KEY.");
}

export function layoutDirectorMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith("/api/layout-director")) return next();
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
      res.statusCode = /API_KEY|No AI provider/.test(message) ? 503 : 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: message }));
    }
  };
}
