"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Users2,
  DollarSign,
  Award,
  Bell,
  Settings,
  Zap,
  Building2,
  Tag,
  Ticket,
  MapPin,
  Gift,
  ShoppingCart,
  Star,
  Clock,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/clubs", label: "Clubs", icon: Building2 },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/users", label: "Users", icon: Users },
  { href: "/organizers", label: "Organizers", icon: Users2 },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/wallets", label: "User Wallets", icon: Users2 },
  { href: "/waitlist", label: "Waitlist", icon: Clock },
  { href: "/wristbands", label: "Wristbands", icon: CreditCard },
  { href: "/loyalty", label: "Loyalty", icon: Award },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/promo-codes", label: "Promo Codes", icon: Tag },
  { href: "/passes", label: "Passes", icon: Ticket },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-[#111827]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D93B2F]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">PartyPass</span>
        <span className="ml-auto rounded-full bg-[#D93B2F]/20 px-2 py-0.5 text-xs font-medium text-[#D93B2F]">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#D93B2F] text-white"
                      : "text-[#9CA3AF] hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-4">
        <p className="text-center text-xs text-[#9CA3AF]">
          PartyPass Admin v1.0
        </p>
      </div>
    </aside>
  );
}
