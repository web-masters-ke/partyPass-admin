"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Ticket,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  BellRing,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { adminApi, organizerApi, usersApi, unwrap } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

interface OrganizerDetail {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isBanned: boolean;
    createdAt: string;
    mpesaPhone?: string;
    payoutMethod?: string;
    paybillNumber?: string;
    tillNumber?: string;
  };
  stats: {
    totalEvents: number;
    totalTicketsSold: number;
    totalOrders: number;
    grossRevenue: number;
  };
  events: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    ticketsSold: number;
    revenue: number;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    phone: string;
    mpesaRef?: string;
    adminNotes?: string;
    requestedAt: string;
    approvedAt?: string;
  }>;
}

const EVENT_STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  CANCELLED: "destructive",
  COMPLETED: "info",
};

const PAYOUT_STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  COMPLETED: "success",
  APPROVED: "info",
  PROCESSING: "info",
  PENDING: "warning",
  FAILED: "destructive",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

const TABS = ["Events", "Payouts", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function OrganizerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<OrganizerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Events");
  const [actionId, setActionId] = useState<string | null>(null);
  const [banLoading, setBanLoading] = useState(false);
  const [roleChanging, setRoleChanging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrganizerDetail(id);
      setDetail(unwrap<OrganizerDetail>(res));
    } catch {
      toast.error("Failed to load organizer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const approvePayout = async (payoutId: string) => {
    setActionId(payoutId);
    try {
      await organizerApi.approvePayout(payoutId);
      toast.success("Payout approved & M-Pesa B2C initiated");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to approve payout");
    } finally {
      setActionId(null);
    }
  };

  const rejectPayout = async (payoutId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setActionId(payoutId);
    try {
      await organizerApi.rejectPayout(payoutId, reason);
      toast.success("Payout rejected");
      load();
    } catch {
      toast.error("Failed to reject payout");
    } finally {
      setActionId(null);
    }
  };

  const toggleBan = async () => {
    if (!detail) return;
    const isBanned = detail.user.isBanned;
    const confirmed = window.confirm(
      isBanned
        ? `Activate account for ${detail.user.firstName} ${detail.user.lastName}?`
        : `Suspend account for ${detail.user.firstName} ${detail.user.lastName}? They will not be able to log in.`
    );
    if (!confirmed) return;
    setBanLoading(true);
    try {
      if (isBanned) {
        await usersApi.unban(detail.user.id);
        toast.success("Account activated");
      } else {
        await usersApi.ban(detail.user.id);
        toast.success("Account suspended");
      }
      load();
    } catch {
      toast.error("Action failed");
    } finally {
      setBanLoading(false);
    }
  };

  const changeRole = async (newRole: string) => {
    if (!detail) return;
    setRoleChanging(true);
    try {
      // PATCH /admin/organizers/:id/role — same adminApi namespace
      await (adminApi as any).updateOrganizerRole?.(id, newRole) ??
        // fall back to a generic PATCH if method not yet in adminApi
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/organizers/${id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
      toast.success("Role updated");
      load();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setRoleChanging(false);
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="h-32 w-full rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-24 text-center text-gray-400">
        <p>Organizer not found.</p>
        <Link href="/organizers">
          <Button variant="outline" className="mt-4">Back to Organizers</Button>
        </Link>
      </div>
    );
  }

  const { user, stats, events, payouts } = detail;
  const netEarnings = stats.grossRevenue * 0.95;
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");
  const hasPending = pendingPayouts.length > 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/organizers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizers
      </Link>

      {/* Profile header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Avatar + info */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xl font-bold text-[#D93B2F]">
                {getInitials(user.firstName, user.lastName)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </h1>
                  <Badge variant={user.isBanned ? "destructive" : "success"}>
                    {user.isBanned ? "Banned" : "Active"}
                  </Badge>
                  <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {hasPending && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  onClick={() => {
                    setActiveTab("Payouts");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Payout ({pendingPayouts.length})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => toast("Notification feature coming soon")}
              >
                <BellRing className="h-4 w-4" />
                Send Notification
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`gap-1.5 ${
                  user.isBanned
                    ? "text-green-700 border-green-300 hover:bg-green-50"
                    : "text-red-600 border-red-200 hover:bg-red-50"
                }`}
                disabled={banLoading}
                onClick={toggleBan}
              >
                {user.isBanned ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <ShieldOff className="h-4 w-4" />
                )}
                {banLoading ? "Updating…" : user.isBanned ? "Activate Account" : "Suspend Account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-5">
        <StatsCard
          title="Total Events"
          value={stats.totalEvents.toLocaleString()}
          icon={CalendarDays}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Tickets Sold"
          value={stats.totalTicketsSold.toLocaleString()}
          icon={Ticket}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Gross Revenue"
          value={formatCurrency(stats.grossRevenue)}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Net Earnings"
          value={formatCurrency(netEarnings)}
          icon={TrendingUp}
          iconBg="bg-[#D93B2F]/10"
          iconColor="text-[#D93B2F]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#D93B2F] text-[#D93B2F]"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab}
            {tab === "Payouts" && hasPending && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#D93B2F] text-[9px] font-bold text-white">
                {pendingPayouts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Events Tab ── */}
      {activeTab === "Events" && (
        <Card>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No events yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Title</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Date</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Tickets Sold</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[220px] truncate">
                          {ev.title}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={EVENT_STATUS_BADGE[ev.status] ?? "secondary"}>
                            {ev.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(ev.startDate)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                          {ev.ticketsSold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(ev.revenue)}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/events/${ev.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              View Event
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Payouts Tab ── */}
      {activeTab === "Payouts" && (
        <Card>
          <CardContent className="p-0">
            {payouts.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No payout requests</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr>
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
                      <tr
                        key={p.id}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                      >
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.phone}</td>
                        <td className="px-4 py-3">
                          <Badge variant={PAYOUT_STATUS_BADGE[p.status] ?? "secondary"}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
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
                                onClick={() => approvePayout(p.id)}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                disabled={actionId === p.id}
                                onClick={() => rejectPayout(p.id)}
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
                              disabled={actionId === p.id}
                              onClick={() => approvePayout(p.id)}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Retry
                            </Button>
                          )}
                          {p.adminNotes && (
                            <p
                              className="mt-1 text-xs text-gray-400 max-w-[200px] truncate"
                              title={p.adminNotes}
                            >
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
      )}

      {/* ── Settings Tab ── */}
      {activeTab === "Settings" && (
        <div className="space-y-4">
          {/* Payout settings (read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    M-Pesa Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.mpesaPhone ?? <span className="text-gray-400 font-normal">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Payout Method
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.payoutMethod ?? <span className="text-gray-400 font-normal">Not set</span>}
                  </p>
                </div>
                {user.paybillNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Paybill Number
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.paybillNumber}
                    </p>
                  </div>
                )}
                {user.tillNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Till Number
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.tillNumber}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role + account control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    Edit Role
                  </label>
                  <select
                    className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#D93B2F]/40 outline-none"
                    defaultValue={user.role}
                    disabled={roleChanging}
                    onChange={(e) => changeRole(e.target.value)}
                  >
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="ATTENDEE">ATTENDEE</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  className={`gap-1.5 ${
                    user.isBanned
                      ? "text-green-700 border-green-300 hover:bg-green-50"
                      : "text-red-600 border-red-200 hover:bg-red-50"
                  }`}
                  disabled={banLoading}
                  onClick={toggleBan}
                >
                  {user.isBanned ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldOff className="h-4 w-4" />
                  )}
                  {banLoading
                    ? "Updating…"
                    : user.isBanned
                    ? "Activate Account"
                    : "Suspend Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
