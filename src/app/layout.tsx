import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { fetchCarnivalForManifest } from "@/lib/server-carnival";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const carnival = await fetchCarnivalForManifest();
  const title = carnival?.name?.trim() || "Carnival Companion";
  const shortTitle =
    carnival?.schoolName?.trim() ||
    carnival?.name?.trim() ||
    "Carnival";
  return {
    title,
    description: "Always know where you need to be, and when.",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: shortTitle.slice(0, 30),
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const carnival = await fetchCarnivalForManifest();
  return {
    themeColor: carnival?.branding?.primaryColor ?? "#0f172a",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
