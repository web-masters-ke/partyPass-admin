"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, Calendar, Ticket, Award, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usersApi, unwrap } from "@/lib/api";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const LOYALTY_COLORS: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  SILVER: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  GOLD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  PLATINUM: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  DIAMOND: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

interface UserDrawerProps {
  userId: string | null;
  onClose: () => void;
  onBanToggle?: (userId: string, banned: boolean) => void;
}

export function UserDrawer({ userId, onClose, onBanToggle }: UserDrawerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    usersApi
      .get(userId)
      .then((res) => setUser(unwrap<User>(res)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const isOpen = !!userId;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">User Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-5">
            <p className="text-gray-400 dark:text-gray-500">User not found</p>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D93B2F] text-white text-xl font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                      BANNED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 shrink-0" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 shrink-0" />
                  {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 shrink-0" />
                Joined {formatDate(user.createdAt)}
              </div>
            </div>

            {/* Loyalty */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-[#D93B2F]" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Loyalty
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    LOYALTY_COLORS[user.loyaltyTier] ??
                      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  )}
                >
                  {user.loyaltyTier}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">
                    {user.loyaltyPoints.toLocaleString()}
                  </strong>{" "}
                  pts
                </span>
              </div>
            </div>

            {/* Verification */}
            <div className="flex items-center gap-2 text-sm">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  user.isVerified ? "bg-green-500" : "bg-yellow-400"
                )}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {user.isVerified ? "Verified account" : "Unverified account"}
              </span>
            </div>

            {/* Ban / Unban */}
            {onBanToggle && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-medium uppercase tracking-wide">
                  Danger Zone
                </p>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full gap-2",
                    user.isActive
                      ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      : "border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                  )}
                  onClick={() => onBanToggle(user.id, user.isActive)}
                >
                  <ShieldBan className="h-4 w-4" />
                  {user.isActive ? "Ban User" : "Unban User"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
