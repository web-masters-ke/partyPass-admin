"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { financesApi, organizerApi, unwrap } from "@/lib/api";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

interface Payout {
  id: string;
  organizerId: string;
  amount: number;
  currency: string;
  status: string;
  phone: string;
  mpesaRef?: string;
  notes?: string;
  adminNotes?: string;
  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;
  organizer: { id: string; firstName: string; lastName: string; email: string; mpesaPhone?: string };
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  COMPLETED: "success",
  APPROVED: "info",
  PROCESSING: "info",
  PENDING: "warning",
  FAILED: "destructive",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

export default function FinancesPage() {
  const [overview, setOverview] = useState<any>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutFilter, setPayoutFilter] = useState("ALL");
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutPages, setPayoutPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    financesApi.overview()
      .then((r) => setOverview(unwrap<any>(r)))
      .finally(() => setLoading(false));
  }, []);

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const res = await organizerApi.adminPayouts({
        page: payoutPage,
        limit: 15,
        status: payoutFilter,
      });
      const data = unwrap<{ items: Payout[]; total: number; totalPages: number }>(res);
      setPayouts(data.items ?? []);
      setPayoutTotal(data.total ?? 0);
      setPayoutPages(data.totalPages ?? 1);
    } catch {
      setPayouts([]);
    } finally {
      setPayoutsLoading(false);
    }
  }, [payoutPage, payoutFilter]);

  useEffect(() => { loadPayouts(); }, [loadPayouts]);
  useEffect(() => { setPayoutPage(1); }, [payoutFilter]);

  const approve = async (id: string) => {
    setActionId(id);
    try {
      await organizerApi.approvePayout(id);
      toast.success("Payout approved & M-Pesa B2C initiated");
      loadPayouts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to approve");
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setActionId(id);
    try {
      await organizerApi.rejectPayout(id, reason);
      toast.success("Payout rejected");
      loadPayouts();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionId(null);
    }
  };

  const revenueChart = overview?.revenueByMonth?.map((m: any) => ({
    date: m.month,
    revenue: m.revenue,
    fees: Math.round(m.revenue * 0.05),
  })) ?? [];

  const pendingCount = payouts.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finances</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform revenue, organizer payouts & transactions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          title="Gross Revenue"
          value={formatCurrency(overview?.totalRevenue ?? 0)}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Platform Fees (5%)"
          value={formatCurrency((overview?.totalRevenue ?? 0) * 0.05)}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Pending Payouts"
          value={formatCurrency(overview?.pendingPayouts ?? 0)}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Paid Orders"
          value={(overview?.paidOrdersCount ?? 0).toLocaleString()}
          icon={CheckCircle2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Revenue chart */}
      {revenueChart.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue vs Platform Fees (Last 12 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D93B2F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D93B2F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number, n: string) => [formatCurrency(v), n === "revenue" ? "Revenue" : "Fees"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#D93B2F" strokeWidth={2} fill="url(#rG)" />
                <Area type="monotone" dataKey="fees" stroke="#22C55E" strokeWidth={2} fill="url(#fG)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top events */}
      {overview?.topEvents?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Revenue Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.topEvents.map((e: any, i: number) => (
                <div key={e.eventId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.orders} orders</p>
                    </div>
                  </div>
                  <p className="ml-4 shrink-0 font-bold text-gray-900 dark:text-gray-100">{formatCurrency(e.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Payout Management ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Organizer Payouts
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D93B2F] text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{payoutTotal.toLocaleString()} total requests</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadPayouts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["ALL", "PENDING", "APPROVED", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setPayoutFilter(s)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                payoutFilter === s
                  ? "bg-[#D93B2F] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {payoutsLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/20" />
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No payout requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Organizer</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Phone</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">M-Pesa Ref</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Requested</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                              {getInitials(p.organizer.firstName, p.organizer.lastName)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {p.organizer.firstName} {p.organizer.lastName}
                              </p>
                              <p className="text-xs text-gray-400">{p.organizer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(p.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.phone}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[p.status] ?? "secondary"}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {p.mpesaRef ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatDateTime(p.requestedAt)}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                disabled={actionId === p.id}
                                onClick={() => approve(p.id)}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                disabled={actionId === p.id}
                                onClick={() => reject(p.id)}
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {p.status === "FAILED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => approve(p.id)}
                              disabled={actionId === p.id}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Retry
                            </Button>
                          )}
                          {p.adminNotes && (
                            <p className="mt-1 text-xs text-gray-400 max-w-[200px] truncate" title={p.adminNotes}>
                              {p.adminNotes}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {payoutPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {payoutPage} of {payoutPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={payoutPage <= 1} onClick={() => setPayoutPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={payoutPage >= payoutPages} onClick={() => setPayoutPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
