import { NextResponse } from "next/server";
import { fetchCarnivalForManifest } from "@/lib/server-carnival";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const carnival = await fetchCarnivalForManifest();
  const dataUrl = carnival?.mapDataUrl;
  if (!dataUrl) {
    return NextResponse.json({ error: "No venue map uploaded" }, { status: 404 });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Stored map is malformed" }, { status: 500 });
  }
  const contentType = match[1] || "application/pdf";
  const buffer = Buffer.from(match[2], "base64");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": 'inline; filename="venue-map.pdf"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
