"use client";

import { cn } from "@/lib/utils";
import type { GateScan, ScanResult, TierType } from "@/lib/types";

const TIER_COLORS: Record<TierType, string> = {
  GA: "#6B7280",
  VIP: "#D97706",
  VVIP: "#1A1A1A",
  EARLY_BIRD: "#059669",
  GROUP: "#6366F1",
  TABLE: "#EC4899",
  BACKSTAGE: "#8B5CF6",
  PRESS: "#0EA5E9",
  COMP: "#14B8A6",
  WAITLIST: "#9CA3AF",
};

const TIER_BG: Record<TierType, string> = {
  GA: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  VIP: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
  VVIP: "bg-gray-900 text-white",
  EARLY_BIRD: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  GROUP: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300",
  TABLE: "bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300",
  BACKSTAGE: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300",
  PRESS: "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300",
  COMP: "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300",
  WAITLIST: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
};

function ResultBadge({ result, entryNumber }: { result: ScanResult; entryNumber?: number }) {
  if (result === "APPROVED" || result === "OVERRIDE_APPROVED") {
    return (
      <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
        APPROVED
      </span>
    );
  }
  if (result === "DENIED_REENTRY_NOT_ALLOWED") {
    return (
      <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
        {entryNumber ? `RE-ENTRY #${entryNumber}` : "RE-ENTRY"}
      </span>
    );
  }
  if (result.startsWith("DENIED")) {
    const reason = result.replace("DENIED_", "").replace(/_/g, " ");
    return (
      <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
        {`DENIED: ${reason}`}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
      {result}
    </span>
  );
}

interface ScanFeedItemProps {
  scan: GateScan;
  isNew?: boolean;
}

export function ScanFeedItem({ scan, isNew }: ScanFeedItemProps) {
  const tierType = scan.ticketTier?.tierType;
  const tierBg = tierType ? TIER_BG[tierType] : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";

  const time = new Date(scan.scannedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0",
        isNew && "scan-entry-new"
      )}
    >
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
        {scan.user
          ? `${scan.user.firstName.charAt(0)}${scan.user.lastName.charAt(0)}`
          : "?"}
      </div>

      {/* Middle info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {scan.user ? `${scan.user.firstName} ${scan.user.lastName}` : "Unknown User"}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {tierType && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-medium",
                tierBg
              )}
            >
              {scan.ticketTier?.name ?? tierType}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">{scan.gateName}</span>
        </div>
      </div>

      {/* Result + time */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <ResultBadge result={scan.result} entryNumber={scan.entryNumber} />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{time}</span>
      </div>
    </div>
  );
}
