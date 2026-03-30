"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { removeToken, getToken } from "@/lib/auth";
import { authApi } from "@/lib/api";
import Cookies from "js-cookie";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch { return null; }
}

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  events: "Events",
  users: "Users",
  organizers: "Organizers",
  venues: "Venues",
  clubs: "Clubs",
  orders: "Orders",
  finances: "Finances",
  wallets: "User Wallets",
  wallet: "Wallet",
  waitlist: "Waitlist",
  "waiting-room": "Waiting Room",
  wristbands: "Wristbands",
  "venue-portal": "Venue Portal",
  loyalty: "Loyalty",
  rewards: "Rewards",
  "promo-codes": "Promo Codes",
  passes: "Passes",
  reviews: "Reviews",
  notifications: "Notifications",
  settings: "Settings",
  new: "Create New",
  gate: "Gate Dashboard",
  attendees: "Attendees",
  analytics: "Analytics",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.firstName) {
        setAdminName(`${payload.firstName}${payload.lastName ? " " + payload.lastName : ""}`);
      }
    }
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, idx) => ({
    label: pathLabels[seg] || (seg.length > 10 ? seg.slice(0, 8) + "\u2026" : seg),
    href: "/" + segments.slice(0, idx + 1).join("/"),
  }));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    removeToken();
    Cookies.remove("partypass_token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 shadow-sm">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            )}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "font-semibold text-gray-900 dark:text-gray-100"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D93B2F]">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
            {adminName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </div>
    </header>
  );
}
