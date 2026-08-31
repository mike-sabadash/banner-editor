import type { IncomingMessage, ServerResponse } from "node:http";

export type LayoutElementInput = {
  id: string;
  role: "background" | "logo" | "headline" | "text" | "cta" | "legal" | "image";
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
  master: { width: number; height: number; elements: LayoutElementInput[] };
  target: { id: string; width: number; height: number; elements: LayoutElementInput[] };
};

const schema = {
  type: "OBJECT",
  properties: {
    rationale: { type: "STRING" },
    elements: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          x: { type: "NUMBER" },
          y: { type: "NUMBER" },
          width: { type: "NUMBER" },
          scale: { type: "NUMBER" },
          fontSize: { type: "NUMBER" },
          visible: { type: "BOOLEAN" },
        },
        required: ["id", "x", "y", "width", "scale", "fontSize", "visible"],
      },
    },
  },
  required: ["rationale", "elements"],
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function sanitize(result: any, request: LayoutDirectorRequest) {
  const allowed = new Map(request.target.elements.map((e) => [e.id, e]));
  return {
    rationale: typeof result?.rationale === "string" ? result.rationale.slice(0, 600) : "AI layout",
    elements: Array.isArray(result?.elements)
      ? result.elements
          .filter((item: any) => allowed.has(item?.id))
          .map((item: any) => {
            const original = allowed.get(item.id)!;
            return {
              id: item.id,
              x: clamp(Number(item.x ?? original.x), -20, 120),
              y: clamp(Number(item.y ?? original.y), -20, 120),
              width: clamp(Number(item.width ?? original.width), 2, 140),
              scale: clamp(Number(item.scale ?? original.scale), 5, 600),
              fontSize: clamp(Number(item.fontSize ?? original.fontSize), 6, 300),
              visible: Boolean(item.visible),
            };
          })
      : [],
  };
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) throw new Error("Request too large");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function runLayoutDirector(payload: LayoutDirectorRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server");
  const model = process.env.GEMINI_LAYOUT_MODEL || "gemini-2.5-flash-lite";
  const prompt = `You are an expert responsive HTML5 advertising art director. Re-layout an existing banner from MASTER to TARGET without changing copy, assets, element ids, or brand intent. Return only the requested structured JSON.\n\nRules:\n- Coordinates x/y and width are percentages of target artboard.\n- Preserve visual hierarchy and reading order.\n- Background should cover the artboard.\n- Logos should stay clearly visible with safe margins and should not dominate.\n- Headline must remain readable; reduce font size and width when necessary.\n- CTA must be visible and tappable if present.\n- Legal text may shrink but should remain legible; never overlap critical content.\n- Prefer reflow/stacking in portrait and compact compositions in very wide strips.\n- Keep important content inside 4% safe margins when possible.\n- You are refining a deterministic first-pass layout, so make conservative, useful corrections instead of redesigning the campaign.\n\nINPUT:\n${JSON.stringify(payload)}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status})`);
  const text = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned an empty layout");
  return sanitize(JSON.parse(text), payload);
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
      res.statusCode = /GEMINI_API_KEY/.test(String(error)) ? 503 : 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Layout Director failed" }));
    }
  };
}
