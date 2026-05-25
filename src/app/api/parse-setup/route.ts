import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You extract the complete configuration of a school athletics carnival from its program document.

The user uploads a program (PDF, image, or text). Your job is to return everything needed to populate the carnival in one shot: meta, age groups, categories, sessions, and every event.

Output STRICT JSON ONLY in this exact shape:
{
  "carnival": {
    "name": "string",          // carnival name as printed on the program
    "date": "YYYY-MM-DD",      // carnival date if visible, otherwise omit
    "venue": "string"           // venue/oval name if visible, otherwise omit
  },
  "ageGroups": [
    {
      "label": "Under 13",          // one per distinct age group on the program
      "birthYearFrom": 2013,         // OPTIONAL — earliest birth year that falls in this group
      "birthYearTo": 2013             // OPTIONAL — latest birth year that falls in this group
    }
  ],
  "categories": [
    { "label": "Boys" }         // typically Boys, Girls. Include Open / Mixed / All-abilities if the program uses them.
  ],
  "sessions": [
    { "name": "Session 1 (morning)", "order": 1 }   // chronological
  ],
  "events": [
    {
      "name": "100m sprint",
      "type": "track" | "field",
      "ageGroupLabel": "Under 13",       // must match a label in ageGroups exactly
      "categoryLabel": "Boys",            // must match a label in categories exactly
      "sessionLabel": "Session 1 (morning)", // must match a name in sessions exactly
      "scheduledTime": "HH:MM",           // 24-hour
      "location": "string"
    }
  ],
  "warnings": ["string"]
}

Rules:
- birthYearFrom / birthYearTo on age groups: include ONLY when the program explicitly states which birth years are in that group (e.g. "U13 (born 2013)" or "Year 7 — 2013"). Use 4-digit years. If a group covers multiple years, set From to the earliest and To to the latest. Omit both fields if the program doesn't give you the years.
- Track events: sprints, distance, relays, hurdles, cross-country, walks.
- Field events: long jump, high jump, triple jump, shot put, discus, javelin.
- Each session normally has multiple events per age group + category combination — extract them all. Do NOT collapse "100m U13 Boys" and "100m U13 Girls" into one entry.
- If the program shows shared start times for several age groups in one row, output one event per age group + category.
- Use 24-hour HH:MM. If a time is unclear, use your best guess and add a warning.
- If category isn't explicit (e.g. an "Open" event for everyone), still emit it under whichever categories make sense — usually a single "Open" category entry plus one event referencing it.
- Order sessions chronologically using the "order" field starting from 1.
- Do NOT include opening ceremony, lunch breaks, presentations, or non-competitive items.
- Return ONLY the JSON object — no markdown code fences, no commentary.`;

type ImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

type ExtractedCarnival = {
  name?: string;
  date?: string;
  venue?: string;
};

type ExtractedEvent = {
  name?: string;
  type?: "track" | "field";
  ageGroupLabel?: string;
  categoryLabel?: string;
  sessionLabel?: string;
  scheduledTime?: string;
  location?: string;
};

type ExtractedAgeGroup = {
  label?: string;
  birthYearFrom?: number;
  birthYearTo?: number;
};

type ExtractionPayload = {
  carnival?: ExtractedCarnival;
  ageGroups?: ExtractedAgeGroup[];
  categories?: { label?: string }[];
  sessions?: { name?: string; order?: number }[];
  events?: ExtractedEvent[];
  warnings?: string[];
};

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
    if (!file) {
      return NextResponse.json(
        { error: "Missing program file" },
        { status: 400 },
      );
    }

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
            "Only PDF, image (PNG/JPEG/WebP), and text-based files (CSV/TXT) are supported.",
        },
        { status: 400 },
      );
    }

    const client = new Anthropic({ apiKey });
    const userContent: Anthropic.ContentBlockParam[] = [];

    if (isText) {
      const text = await file.text();
      userContent.push({
        type: "text",
        text: `Program file contents (${file.name}):\n\n${text.slice(0, 200_000)}`,
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
      text: "Extract the full carnival configuration and every event from this program. Return only the JSON object.",
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 12000,
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

    let parsed: ExtractionPayload;
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

    const warnings: string[] = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((w): w is string => typeof w === "string")
      : [];

    return NextResponse.json({
      carnival: parsed.carnival ?? {},
      ageGroups: (parsed.ageGroups ?? [])
        .map((g) => ({
          label: (g.label ?? "").trim(),
          birthYearFrom:
            typeof g.birthYearFrom === "number" ? g.birthYearFrom : undefined,
          birthYearTo:
            typeof g.birthYearTo === "number" ? g.birthYearTo : undefined,
        }))
        .filter((g) => g.label),
      categories: (parsed.categories ?? [])
        .map((c) => ({ label: (c.label ?? "").trim() }))
        .filter((c) => c.label),
      sessions: (parsed.sessions ?? [])
        .map((s, i) => ({
          name: (s.name ?? "").trim(),
          order: typeof s.order === "number" ? s.order : i + 1,
        }))
        .filter((s) => s.name)
        .sort((a, b) => a.order - b.order),
      events: (parsed.events ?? []).map((e) => ({
        name: e.name ?? "(untitled)",
        type: (e.type === "field" ? "field" : "track") as "track" | "field",
        ageGroupLabel: (e.ageGroupLabel ?? "").trim(),
        categoryLabel: (e.categoryLabel ?? "").trim(),
        sessionLabel: (e.sessionLabel ?? "").trim(),
        scheduledTime: (e.scheduledTime ?? "00:00").trim(),
        location: (e.location ?? "").trim(),
      })),
      warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
