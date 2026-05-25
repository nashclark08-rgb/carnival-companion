import type { MetadataRoute } from "next";
import { fetchCarnivalForManifest } from "@/lib/server-carnival";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const carnival = await fetchCarnivalForManifest();
  const name = carnival?.name?.trim() || "Carnival Companion";
  const shortName =
    (carnival?.schoolName?.trim() || carnival?.name?.trim() || "Carnival").slice(
      0,
      12,
    );
  const primary = carnival?.branding?.primaryColor ?? "#0f172a";
  const logo = carnival?.branding?.logoDataUrl;

  return {
    name,
    short_name: shortName,
    description: "Always know where you need to be, and when.",
    start_url: "/",
    display: "standalone",
    background_color: primary,
    theme_color: primary,
    icons: logo
      ? [
          {
            src: logo,
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: logo,
            sizes: "256x256",
            type: "image/png",
            purpose: "maskable",
          },
        ]
      : [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
  };
}
