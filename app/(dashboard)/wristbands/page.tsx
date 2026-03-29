"use client";

import { useState } from "react";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Search,
  DollarSign,
  ArrowDownCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { adminWristbandApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";

type Analytics = {
  eventId: string;
  totalWristbands: number;
  totalTopup: number;
  totalSpend: number;
  totalRefunds: number;
  averageSpend: number;
  topSpenders: Array<{ userId: string; spend: number }>;
};

export default function WristbandsPage() {
  const [eventId, setEventId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);

  async function loadAnalytics() {
    if (!eventId.trim()) {
      toast.error("Enter an event ID");
      return;
    }
    setLoading(true);
    try {
      const res = await adminWristbandApi.analytics(eventId.trim());
      setAnalytics(unwrap<Analytics>(res));
    } catch {
      toast.error("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefundAll() {
    if (!eventId.trim()) return;
    if (
      !confirm(
        `Refund all active wristband balances for event ${eventId}? This cannot be undone.`
      )
    )
      return;
    setRefunding(true);
    try {
      const res = await adminWristbandApi.refundAll(eventId.trim());
      const data = unwrap<{ refundCount: number; totalRefunded: number }>(res);
      toast.success(
        `Refunded ${data.refundCount} wristbands — KES ${data.totalRefunded.toFixed(2)} total`
      );
      loadAnalytics();
    } catch {
      toast.error("Refund failed");
    } finally {
      setRefunding(false);
    }
  }

  const unspent =
    analytics != null
      ? Math.max(
          0,
          analytics.totalTopup - analytics.totalSpend - analytics.totalRefunds
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Wristband Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cashless bar wallet stats per event
        </p>
      </div>

      {/* Event selector */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Look up an event
          </p>
          <div className="flex gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Paste event ID…"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAnalytics()}
              />
            </div>
            <Button
              onClick={loadAnalytics}
              disabled={loading}
              className="bg-[#D93B2F] hover:bg-[#b52e24]"
            >
              {loading ? "Loading…" : "Load Analytics"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Wristbands Issued"
              value={analytics.totalWristbands.toLocaleString()}
              icon={Users}
              iconBg="bg-blue-50 dark:bg-blue-900/20"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <StatsCard
              title="Total Top-ups"
              value={`KES ${analytics.totalTopup.toLocaleString()}`}
              icon={ArrowDownCircle}
              iconBg="bg-green-50 dark:bg-green-900/20"
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatsCard
              title="Total Spend"
              value={`KES ${analytics.totalSpend.toLocaleString()}`}
              icon={DollarSign}
              iconBg="bg-[#D93B2F]/10"
              iconColor="text-[#D93B2F]"
            />
            <StatsCard
              title="Total Refunds"
              value={`KES ${analytics.totalRefunds.toLocaleString()}`}
              icon={RotateCcw}
              iconBg="bg-gray-100 dark:bg-gray-800"
              iconColor="text-gray-500 dark:text-gray-400"
            />
            <StatsCard
              title="Avg Spend / Wristband"
              value={`KES ${analytics.averageSpend.toFixed(0)}`}
              icon={CreditCard}
              iconBg="bg-purple-50 dark:bg-purple-900/20"
              iconColor="text-purple-600 dark:text-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top spenders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Top Spenders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {analytics.topSpenders.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                    No purchases yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topSpenders.map((s, i) => (
                      <div key={s.userId} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-5 text-right">
                          {i + 1}
                        </span>
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "#D93B2F" }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate text-gray-500 dark:text-gray-400">
                            {s.userId}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          KES {s.spend.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {[
                    {
                      label: "Loaded to wristbands",
                      value: analytics.totalTopup,
                      barColor: "bg-blue-500",
                      textColor:
                        "text-blue-600 dark:text-blue-400",
                    },
                    {
                      label: "Spent at venue",
                      value: analytics.totalSpend,
                      barColor: "bg-[#D93B2F]",
                      textColor: "text-[#D93B2F]",
                    },
                    {
                      label: "Refunded",
                      value: analytics.totalRefunds,
                      barColor: "bg-gray-400",
                      textColor:
                        "text-gray-500 dark:text-gray-400",
                    },
                    {
                      label: "Unspent (held)",
                      value: unspent,
                      barColor: "bg-yellow-400",
                      textColor:
                        "text-yellow-600 dark:text-yellow-400",
                    },
                  ].map(({ label, value, barColor, textColor }) => {
                    const pct =
                      analytics.totalTopup > 0
                        ? Math.min(
                            100,
                            (value / analytics.totalTopup) * 100
                          )
                        : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <span className={`font-semibold ${textColor}`}>
                            KES {value.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                            style={{ width: `${pct.toFixed(1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Utilisation summary */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  {analytics.totalTopup > 0 ? (
                    <>
                      {analytics.totalSpend / analytics.totalTopup >= 0.7 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-yellow-500 shrink-0" />
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {((analytics.totalSpend / analytics.totalTopup) * 100).toFixed(0)}%
                        </span>{" "}
                        of loaded funds spent at venue
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">No top-ups yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Post-event refund */}
          <Card className="border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">
                    Post-Event Refund
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Refund all remaining wristband balances after the event ends.
                    This deactivates all wristbands and marks them as refunded.
                    This action is irreversible.
                  </p>
                  <Button
                    onClick={handleRefundAll}
                    disabled={refunding}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {refunding
                      ? "Refunding…"
                      : "Refund All Wristbands for This Event"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!analytics && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
            <CreditCard className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            No event selected
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Paste an event ID above to view wristband analytics
          </p>
        </div>
      )}
    </div>
  );
}
