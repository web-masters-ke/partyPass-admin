"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GateDashboard, GateScan, ScanResult, TierType } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

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

function ResultBadge({ result }: { result: ScanResult }) {
  if (result === "APPROVED" || result === "OVERRIDE_APPROVED") {
    return (
      <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
        APPROVED
      </span>
    );
  }
  if (result.includes("RE_ENTRY")) {
    return (
      <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
        RE-ENTRY
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
      DENIED
    </span>
  );
}

interface GateDashboardProps {
  eventId: string;
  initialData?: GateDashboard | null;
}

export function GateDashboardComponent({ eventId, initialData }: GateDashboardProps) {
  const [data, setData] = useState<GateDashboard | null>(initialData ?? null);
  const [recentScans, setRecentScans] = useState<GateScan[]>(initialData?.recentScans ?? []);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = useCallback(() => {
    const socket = io(WS_URL, {
      auth: { token: typeof window !== "undefined" ? localStorage.getItem("partypass_token") : "" },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", `event-${eventId}`);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("gate:scan", (scan: GateScan) => {
      setRecentScans((prev) => [scan, ...prev].slice(0, 10));
      setData((prev) => {
        if (!prev) return prev;
        const newInside =
          scan.result === "APPROVED" || scan.result === "OVERRIDE_APPROVED"
            ? prev.currentInside + 1
            : prev.currentInside;
        const newDenied = scan.result.startsWith("DENIED")
          ? prev.totalDenied + 1
          : prev.totalDenied;
        return {
          ...prev,
          currentInside: newInside,
          totalScans: prev.totalScans + 1,
          totalApproved: scan.result === "APPROVED" ? prev.totalApproved + 1 : prev.totalApproved,
          totalDenied: newDenied,
          gates: prev.gates.map((g) =>
            g.gateId === scan.gateId
              ? {
                  ...g,
                  scannedCount: g.scannedCount + 1,
                  approvedCount:
                    scan.result === "APPROVED" ? g.approvedCount + 1 : g.approvedCount,
                  deniedCount: scan.result.startsWith("DENIED")
                    ? g.deniedCount + 1
                    : g.deniedCount,
                }
              : g
          ),
        };
      });
    });

    socket.on("gate:dashboard-update", (update: Partial<GateDashboard>) => {
      setData((prev) => (prev ? { ...prev, ...update } : (update as GateDashboard)));
    });

    socketRef.current = socket;
  }, [eventId]);

  useEffect(() => {
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [connectSocket]);

  const capacityPct = data ? Math.round((data.currentInside / data.maxCapacity) * 100) : 0;
  const capacityColor =
    capacityPct > 90 ? "#D93B2F" : capacityPct > 70 ? "#F59E0B" : "#22C55E";

  const pieData = [
    { name: "Inside", value: data?.currentInside ?? 0, color: capacityColor },
    { name: "Available", value: (data?.maxCapacity ?? 0) - (data?.currentInside ?? 0), color: "#E5E7EB" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: Gate stats */}
      <div className="space-y-4 lg:col-span-1">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              connected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {connected ? "Live" : "Reconnecting..."}
          </span>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#111827] p-4 text-center">
            <p className="text-3xl font-bold text-white">{data?.currentInside ?? 0}</p>
            <p className="mt-1 text-xs text-gray-400">Currently Inside</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.maxCapacity ?? 0}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Total Capacity</p>
          </div>
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{data?.totalApproved ?? 0}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Approved</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data?.totalDenied ?? 0}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Denied</p>
          </div>
        </div>

        {/* Capacity gauge */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</span>
            <span className="text-sm font-bold" style={{ color: capacityColor }}>
              {capacityPct}%
            </span>
          </div>
          <Progress value={capacityPct} className="h-3" />
          <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
            {data?.currentInside ?? 0} / {data?.maxCapacity ?? 0}
          </p>
        </div>

        {/* Per-gate stats bar chart */}
        {data && data.gates.length > 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Entries per Gate</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.gates} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="gateName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 6 }}
                />
                <Bar dataKey="approvedCount" fill="#D93B2F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Center: Live scan feed */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:col-span-1">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Scan Feed</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto" style={{ maxHeight: 480 }}>
          {recentScans.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              Waiting for scans...
            </div>
          ) : (
            recentScans.map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                  {scan.user
                    ? `${scan.user.firstName.charAt(0)}${scan.user.lastName.charAt(0)}`
                    : "?"}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {scan.user
                      ? `${scan.user.firstName} ${scan.user.lastName}`
                      : "Unknown User"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {scan.ticketTier && (
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: TIER_COLORS[scan.ticketTier.tierType] || "#6B7280",
                        }}
                      >
                        {scan.ticketTier.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{scan.gateName}</span>
                  </div>
                </div>
                {/* Result + time */}
                <div className="flex flex-col items-end gap-1">
                  <ResultBadge result={scan.result} />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(scan.scannedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Capacity donut + denied breakdown */}
      <div className="space-y-4 lg:col-span-1">
        {/* Donut chart */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Capacity Overview</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-2 space-y-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entry.name}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{entry.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Denied reasons */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Denial Reasons</h3>
          {recentScans.filter((s) => s.result.startsWith("DENIED")).length === 0 ? (
            <p className="text-xs text-gray-400">No denials yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(
                recentScans
                  .filter((s) => s.result.startsWith("DENIED"))
                  .reduce<Record<string, number>>((acc, s) => {
                    acc[s.result] = (acc[s.result] || 0) + 1;
                    return acc;
                  }, {})
              ).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {reason.replace("DENIED_", "").replace(/_/g, " ")}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total scans summary */}
        <div className="rounded-xl bg-[#D93B2F]/5 border border-[#D93B2F]/20 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Scans</p>
          <p className="text-4xl font-bold text-[#D93B2F]">{data?.totalScans ?? 0}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Since event started</p>
        </div>
      </div>
    </div>
  );
}
