"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./nextalkmobilenav";
import { DesktopNav } from "./nextalkdesktopnav";
import { FloatingMessagesPill } from "./nextalkfloatingmessagespill";
import { SiteFooter } from "./nextalksitefooter";
import { UserPreferencesBoot } from "./nextalkuserpreferencesboot";
import { SololaThemedLogo } from "./sololathemedlogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAuthFlow = pathname.startsWith("/auth") || pathname.startsWith("/account-restricted");

  if (isAuthFlow) {
    return <div className="min-h-[100svh] w-full bg-[#0D0D0D]">{children}</div>;
  }

  return (
    <div className="app-shell">
      <DesktopNav />
      <div className="tg-topbar px-4 py-3 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Solola accueil">
            <SololaThemedLogo width={36} height={36} className="rounded-lg" priority />
            <div>
              <p className="text-sm font-semibold text-white">Solola</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">TALA • BISA • ZONGA</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/messages" className="wa-pill wa-pill-active px-3 py-1.5 text-xs font-semibold">
              Messages
            </Link>
            <Link href="/stories" className="wa-pill px-3 py-1.5 text-xs">
              Stories
            </Link>
            <Link href="/settings" className="wa-pill px-3 py-1.5 text-xs">
              Parametres
            </Link>
          </div>
        </div>
      </div>
      <main className="min-h-screen w-full pb-24 md:pb-8 md:pl-[76px]">
        <UserPreferencesBoot />
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-8 md:pt-6">
          {children}
          <SiteFooter />
        </div>
      </main>
      <MobileNav />
      <FloatingMessagesPill />
    </div>
  );
}
