"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  UserCheck,
  Shield,
  Mail,
  CreditCard,
  ClipboardList,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
  children?: { href: string; label: string; match: (p: string) => boolean }[];
}

const NAV: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/admin/dashboard" || p === "/admin",
  },
  {
    href: "/admin/coaches",
    label: "Coaches",
    icon: UserCheck,
    match: (p) => p.startsWith("/admin/coaches"),
    children: [
      {
        href: "/admin/coaches",
        label: "Coach list",
        match: (p) => p === "/admin/coaches",
      },
      {
        href: "/admin/coaches/new",
        label: "Add coach",
        match: (p) => p === "/admin/coaches/new",
      },
    ],
  },
  {
    href: "/admin/organizations",
    label: "Organizations",
    icon: Building2,
    match: (p) => p.startsWith("/admin/organizations"),
    children: [
      {
        href: "/admin/organizations",
        label: "Organization list",
        match: (p) => p === "/admin/organizations",
      },
      {
        href: "/admin/organizations/new",
        label: "Add organization",
        match: (p) => p === "/admin/organizations/new",
      },
    ],
  },
  {
    href: "/admin/users",
    label: "All users",
    icon: Users,
    match: (p) => p.startsWith("/admin/users"),
  },
  {
    href: "/admin/invitations",
    label: "Invitations",
    icon: Mail,
    match: (p) => p.startsWith("/admin/invitations"),
  },
  {
    href: "/admin/billing",
    label: "Billing",
    icon: CreditCard,
    match: (p) => p.startsWith("/admin/billing"),
  },
  {
    href: "/admin/audit-log",
    label: "Audit log",
    icon: ClipboardList,
    match: (p) => p.startsWith("/admin/audit-log"),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/admin/settings"),
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mt-8 flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              className={[
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
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
              {item.children ? (
                <ChevronDown
                  className={[
                    "ml-auto h-4 w-4 transition-transform",
                    active ? "rotate-0 text-white" : "-rotate-90 text-slate-500",
                  ].join(" ")}
                />
              ) : active ? (
                <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/80" />
              ) : null}
            </Link>

            {item.children && active ? (
              <div className="ml-7 mt-1 flex flex-col gap-1 border-l border-slate-700 pl-3">
                {item.children.map((child) => {
                  const childActive = child.match(pathname);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={[
                        "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        childActive
                          ? "bg-violet-500/20 text-violet-200"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
                      ].join(" ")}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-6 border-t border-slate-800/60 pt-4">
        <Link
          href="/coach/dashboard"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
        >
          <Shield className="h-[18px] w-[18px] text-slate-500 group-hover:text-white" />
          <span>Coach portal</span>
        </Link>
      </div>
    </nav>
  );
}
