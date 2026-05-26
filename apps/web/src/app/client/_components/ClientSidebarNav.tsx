"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  History,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/client/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/client/dashboard" || p === "/client",
  },
  {
    href: "/client/program",
    label: "My program",
    icon: Calendar,
    match: (p) => p.startsWith("/client/program"),
  },
  {
    href: "/client/history",
    label: "History",
    icon: History,
    match: (p) => p.startsWith("/client/history"),
  },
];

export function ClientSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mt-8 flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
            ].join(" ")}
          >
            <item.icon
              className={[
                "h-[18px] w-[18px] transition-colors",
                active ? "text-white" : "text-slate-400 group-hover:text-white",
              ].join(" ")}
            />
            <span>{item.label}</span>
            {active ? (
              <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
