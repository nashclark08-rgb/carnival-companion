"use client";

import { Carnival } from "@/lib/types";

type Props = {
  carnival: Carnival | null;
  subtitle?: string;
  action?: React.ReactNode;
};

export function BrandedHeader({ carnival, subtitle, action }: Props) {
  const logo = carnival?.branding?.logoDataUrl;
  const school = carnival?.schoolName;
  const title = carnival?.name ?? "Carnival Companion";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logo}
            alt={school ?? "School logo"}
            className="h-10 w-10 rounded object-contain"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gradient-to-br from-indigo-500 to-violet-600" />
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}
