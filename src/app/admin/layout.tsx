"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOutAdmin, useAdminAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/setup", label: "Setup" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/preview", label: "Preview" },
  { href: "/admin/qr", label: "QR code" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLogin) {
      router.replace("/admin/login");
    }
  }, [user, loading, isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (loading || !user) {
    return <p className="p-6 text-center text-slate-500">Checking sign in…</p>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin" className="font-bold">
            Carnival Companion · Admin
          </Link>
          <button
            onClick={async () => {
              await signOutAdmin();
              router.replace("/admin/login");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
        <ul className="mx-auto flex max-w-5xl flex-wrap gap-2 text-sm">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`rounded-md px-3 py-1 ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </div>
  );
}
