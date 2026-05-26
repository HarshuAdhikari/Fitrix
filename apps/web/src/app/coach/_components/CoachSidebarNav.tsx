"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  CalendarDays,
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
    href: "/coach/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/coach/dashboard" || p === "/coach",
  },
  {
    href: "/coach/clients",
    label: "Clients",
    icon: Users,
    match: (p) => p.startsWith("/coach/clients"),
  },
  {
    href: "/coach/plans",
    label: "Workouts",
    icon: ClipboardList,
    match: (p) => p.startsWith("/coach/plans"),
  },
  {
    href: "/coach/schedules",
    label: "Schedules",
    icon: CalendarDays,
    match: (p) => p.startsWith("/coach/schedules"),
  },
  {
    href: "/coach/workouts",
    label: "Exercise Library",
    icon: Dumbbell,
    match: (p) => p.startsWith("/coach/workouts"),
  },
];

export function CoachSidebarNav() {
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
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
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
