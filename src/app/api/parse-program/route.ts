import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract athletics carnival events from a school carnival program.

The user will provide a program document (PDF or image) listing events. Your job is to extract every distinct event and map it to the carnival's configured age groups, categories, and sessions.

Output STRICT JSON ONLY in this exact shape:
{
  "events": [
    {
      "name": "100m sprint",
      "type": "track" | "field",
      "ageGroupId": "<id from provided list>",
      "categoryId": "<id from provided list>",
      "sessionId": "<id from provided list>",
      "scheduledTime": "HH:MM",
      "location": "string"
    }
  ],
  "warnings": ["string", ...]
}

Rules:
- Track events: running events (sprints, middle/long distance, relays, hurdles, cross-country, walks)
- Field events: jumps and throws (long jump, high jump, triple jump, shot put, discus, javelin)
- "scheduledTime" must be 24-hour HH:MM. If a time is ambiguous, use your best guess and add a warning.
- Use the provided IDs (ageGroupId, categoryId, sessionId) — never the human label.
- One event entry per age-group + category combination. "100m Under 13 Boys" and "100m Under 13 Girls" are TWO events.
- Do NOT invent events that aren't in the program.
- Do NOT include opening ceremony, lunch breaks, presentations, or non-competitive items.
- If a column or row of the program is unreadable, add a warning describing what was missed.
- Return ONLY the JSON object — no markdown code fences, no commentary, no preamble.`;

type AgeGroup = { id: string; label: string };
type Category = { id: string; label: string };
type Session = { id: string; name: string; order: number };

type ParseContext = {
  carnivalDate: string;
  ageGroups: AgeGroup[];
  categories: Category[];
  sessions: Session[];
};

type ImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const contextJson = formData.get("context") as string | null;

    if (!file || !contextJson) {
      return NextResponse.json(
        { error: "Missing file or carnival context" },
        { status: 400 },
      );
    }

    const context: ParseContext = JSON.parse(contextJson);

    const mediaType = file.type;
    const fileName = file.name.toLowerCase();
    const isPdf = mediaType === "application/pdf";
    const isImage = mediaType.startsWith("image/");
    const isText =
      mediaType.startsWith("text/") ||
      mediaType === "application/csv" ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".tsv");

    if (!isPdf && !isImage && !isText) {
      return NextResponse.json(
        {
          error:
            "Only PDF, image (PNG/JPEG/WebP), and text-based files (CSV/TXT) are supported. Export Excel to CSV first.",
        },
        { status: 400 },
      );
    }

    const client = new Anthropic({ apiKey });
    const userContent: Anthropic.ContentBlockParam[] = [];

    if (isText) {
      const text = await file.text();
      const truncated = text.slice(0, 200_000);
      userContent.push({
        type: "text",
        text: `Program file contents (${file.name}):\n\n${truncated}`,
      });
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      if (isPdf) {
        userContent.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        });
      } else {
        userContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType as ImageMediaType,
            data: base64,
          },
        });
      }
    }

    userContent.push({
      type: "text",
      text: [
        `Carnival date: ${context.carnivalDate}`,
        "",
        "Age groups (use the id, not the label):",
        ...context.ageGroups.map((g) => `- ${g.id}: ${g.label}`),
        "",
        "Categories (use the id, not the label):",
        ...context.categories.map((c) => `- ${c.id}: ${c.label}`),
        "",
        "Sessions (use the id, not the name):",
        ...context.sessions.map((s) => `- ${s.id}: ${s.name}`),
        "",
        "Extract all events from this program. Return only the JSON object.",
      ].join("\n"),
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 502 },
      );
    }

    const cleaned = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: {
      events?: Array<{
        name?: string;
        type?: "track" | "field";
        ageGroupId?: string;
        categoryId?: string;
        sessionId?: string;
        scheduledTime?: string;
        location?: string;
      }>;
      warnings?: string[];
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: "Model returned invalid JSON",
          raw: textBlock.text.slice(0, 500),
        },
        { status: 502 },
      );
    }

    if (!Array.isArray(parsed.events)) {
      return NextResponse.json(
        { error: "Response missing events array" },
        { status: 502 },
      );
    }

    const carnivalDate = context.carnivalDate;
    const events = parsed.events.map((e) => {
      const time = (e.scheduledTime ?? "00:00").trim();
      const [hStr, mStr] = time.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const d = new Date(carnivalDate || new Date().toISOString().slice(0, 10));
      d.setHours(
        Number.isFinite(h) ? h : 0,
        Number.isFinite(m) ? m : 0,
        0,
        0,
      );
      return {
        name: e.name ?? "(untitled)",
        type: (e.type === "field" ? "field" : "track") as "track" | "field",
        ageGroupId: e.ageGroupId ?? "",
        categoryId: e.categoryId ?? "",
        sessionId: e.sessionId ?? "",
        scheduledTime: d.getTime(),
        location: e.location ?? "",
      };
    });

    const usage = message.usage as Anthropic.Messages.Usage & {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };

    return NextResponse.json({
      events,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
