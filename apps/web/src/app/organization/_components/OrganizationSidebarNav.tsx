"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  CalendarDays,
  Mail,
  UserSquare,
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
    href: "/organization/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/organization/dashboard" || p === "/organization",
  },
  {
    href: "/organization/team",
    label: "Team",
    icon: Users,
    match: (p) => p.startsWith("/organization/team"),
  },
  {
    href: "/organization/programs",
    label: "Programs",
    icon: ClipboardList,
    match: (p) => p.startsWith("/organization/programs"),
  },
  {
    href: "/organization/clients",
    label: "Clients",
    icon: UserSquare,
    match: (p) => p.startsWith("/organization/clients"),
  },
  {
    href: "/coach/schedules",
    label: "Schedules",
    icon: CalendarDays,
    match: (p) => p.startsWith("/coach/schedules"),
  },
  {
    href: "/organization/invitations",
    label: "Invitations",
    icon: Mail,
    match: (p) => p.startsWith("/organization/invitations"),
  },
];

export function OrganizationSidebarNav() {
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
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
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

      <div className="mt-6 border-t border-slate-800/60 pt-4">
        <Link
          href="/coach/dashboard"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
        >
          <Dumbbell className="h-[18px] w-[18px] text-slate-500 group-hover:text-white" />
          <span>Coach portal</span>
        </Link>
        <Link
          href="/coach/plans"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
        >
          <ClipboardList className="h-[18px] w-[18px] text-slate-500 group-hover:text-white" />
          <span>Programs</span>
        </Link>
      </div>
    </nav>
  );
}
