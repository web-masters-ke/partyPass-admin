"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  DollarSign,
  Gift,
  BarChart2,
  CalendarDays,
  Wallet,
  QrCode,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { organizerApi, venuesApi, rewardsApi, unwrap } from "@/lib/api";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import api from "@/lib/api";

type Tab = "events" | "wallet" | "rewards" | "scanner";

interface OrganizerEvent {
  id: string;
  title: string;
  status: string;
  startDateTime: string;
  ticketsSold?: number;
  maxCapacity?: number;
  totalRevenue?: number;
  coverImageUrl?: string;
}

interface OrganizerWallet {
  balance: number;
  currency: string;
  totalEarned: number;
  pendingPayout: number;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  mpesaRef?: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  isActive?: boolean;
  stock?: number;
}

interface ScanResult {
  result: string;
  ticketId?: string;
  ticketHolderName?: string;
  tierName?: string;
  eventTitle?: string;
  denyReason?: string;
  entryNumber?: number;
}

const EVENT_STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  PUBLISHED: "success",
  PRESALE: "info",
  SOLD_OUT: "warning",
  ONGOING: "success",
  DRAFT: "secondary",
  CANCELLED: "destructive",
  PAST: "secondary",
  POSTPONED: "warning",
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/20" />
      ))}
    </div>
  );
}

export default function VenuePortalPage() {
  const [tab, setTab] = useState<Tab>("events");

  // Stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<{
    checkInsToday: number;
    revenueThisMonth: number;
    activeRewards: number;
    occupancyPct: number;
  } | null>(null);

  // Events tab
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);

  // Wallet tab
  const [wallet, setWallet] = useState<OrganizerWallet | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", phone: "", notes: "" });
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Rewards tab
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  // Scanner tab
  const [qrCode, setQrCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Load top-level stats once
  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        // Derive stats from organizer wallet + events
        const [walletRes, eventsRes] = await Promise.all([
          organizerApi.wallet().catch(() => null),
          organizerApi.events({ page: 1, limit: 1 }).catch(() => null),
        ]);
        const w = walletRes ? unwrap<OrganizerWallet>(walletRes) : null;
        const eData = eventsRes
          ? unwrap<{ items: OrganizerEvent[]; total: number }>(eventsRes)
          : null;

        setStats({
          checkInsToday: 0, // requires dedicated endpoint
          revenueThisMonth: w?.totalEarned ?? 0,
          activeRewards: 0, // filled by rewards load
          occupancyPct: 0,  // requires dedicated endpoint
        });

        // Pre-fill wallet state
        if (w) setWallet(w);
        if (eData) {
          setEventsTotal(eData.total ?? 0);
        }
      } catch {
        toast.error("Failed to load portal stats");
        setStats({ checkInsToday: 0, revenueThisMonth: 0, activeRewards: 0, occupancyPct: 0 });
      } finally {
        setStatsLoading(false);
      }
    };
    load();
  }, []);

  // Events loader
  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await organizerApi.events({ page: eventsPage, limit: 10 });
      const data = unwrap<{ items: OrganizerEvent[]; total: number; totalPages: number }>(res);
      setEvents(data.items ?? []);
      setEventsTotal(data.total ?? 0);
      setEventsTotalPages(data.totalPages ?? 1);
    } catch {
      setEvents([]);
      toast.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, [eventsPage]);

  // Wallet loader
  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const [walletRes, payoutsRes] = await Promise.all([
        organizerApi.wallet(),
        organizerApi.payouts({ page: 1, limit: 20 }),
      ]);
      setWallet(unwrap<OrganizerWallet>(walletRes));
      const pd = unwrap<{ items: Payout[] }>(payoutsRes);
      setPayouts(pd.items ?? []);
    } catch {
      toast.error("Failed to load wallet data");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // Rewards loader
  const loadRewards = useCallback(async () => {
    setRewardsLoading(true);
    try {
      const res = await rewardsApi.list();
      const data = unwrap<Reward[]>(res);
      setRewards(Array.isArray(data) ? data : []);
      // Update stats active rewards count
      setStats((prev) =>
        prev ? { ...prev, activeRewards: (Array.isArray(data) ? data : []).filter((r) => r.isActive).length } : prev
      );
    } catch {
      setRewards([]);
      toast.error("Failed to load rewards");
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (tab === "events") loadEvents();
    if (tab === "wallet") loadWallet();
    if (tab === "rewards") loadRewards();
  }, [tab, loadEvents, loadWallet, loadRewards]);

  useEffect(() => {
    if (tab === "events") loadEvents();
  }, [eventsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  async function scan() {
    if (!qrCode.trim()) { toast.error("Enter a QR code"); return; }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.post("/qr/validate", {
        code: qrCode.trim(),
        gateId: "default",
        action: "ENTRY",
      });
      const data = unwrap<ScanResult>(res);
      setScanResult(data);
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Scan failed"
      );
      setScanResult({ result: "DENIED_UNKNOWN" });
    } finally {
      setScanning(false);
    }
  }

  async function requestPayout() {
    const amount = parseFloat(payoutForm.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!payoutForm.phone.trim()) { toast.error("Enter your M-Pesa phone number"); return; }
    setRequestingPayout(true);
    try {
      await organizerApi.requestPayout({
        amount,
        phone: payoutForm.phone.trim(),
        notes: payoutForm.notes || undefined,
      });
      toast.success("Payout request submitted");
      setPayoutForm({ amount: "", phone: "", notes: "" });
      loadWallet();
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Failed to request payout"
      );
    } finally {
      setRequestingPayout(false);
    }
  }

  const isApproved = (r: ScanResult) =>
    r.result === "APPROVED" || r.result === "OVERRIDE_APPROVED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Venue Portal</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your events, earnings, rewards and check-ins
        </p>
      </div>

      {/* Stats overview */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatsCard
            title="Check-ins Today"
            value={(stats?.checkInsToday ?? 0).toLocaleString()}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Revenue This Month"
            value={formatCurrency(stats?.revenueThisMonth ?? 0)}
            icon={DollarSign}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Active Rewards"
            value={(stats?.activeRewards ?? 0).toLocaleString()}
            icon={Gift}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Occupancy %"
            value={`${stats?.occupancyPct ?? 0}%`}
            icon={BarChart2}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {(
          [
            { key: "events", label: "My Events", icon: CalendarDays },
            { key: "wallet", label: "My Wallet", icon: Wallet },
            { key: "rewards", label: "Rewards", icon: Gift },
            { key: "scanner", label: "Check-in Scanner", icon: QrCode },
          ] as { key: Tab; label: string; icon: React.ElementType }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white dark:bg-gray-700 text-[#D93B2F] shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Events Tab ── */}
      {tab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{eventsTotal.toLocaleString()} total events</p>
            <Button variant="outline" size="sm" onClick={loadEvents} disabled={eventsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${eventsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {eventsLoading ? (
                <TableSkeleton />
              ) : events.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">No events found. Create your first event to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Event</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Tickets Sold</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr
                          key={ev.id}
                          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">{ev.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={EVENT_STATUS_BADGE[ev.status] ?? "secondary"}>{ev.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {formatDate(ev.startDateTime)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {ev.ticketsSold ?? 0}
                            {ev.maxCapacity ? ` / ${ev.maxCapacity}` : ""}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(ev.totalRevenue ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          {eventsTotalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Page {eventsPage} of {eventsTotalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={eventsPage <= 1} onClick={() => setEventsPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={eventsPage >= eventsTotalPages} onClick={() => setEventsPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Wallet Tab ── */}
      {tab === "wallet" && (
        <div className="space-y-4">
          {walletLoading && !wallet ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : wallet ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatsCard
                title="Available Balance"
                value={formatCurrency(wallet.balance)}
                icon={Wallet}
                iconBg="bg-green-50"
                iconColor="text-green-600"
              />
              <StatsCard
                title="Total Earned"
                value={formatCurrency(wallet.totalEarned)}
                icon={DollarSign}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Pending Payout"
                value={formatCurrency(wallet.pendingPayout)}
                icon={RefreshCw}
                iconBg="bg-yellow-50"
                iconColor="text-yellow-600"
              />
            </div>
          ) : null}

          {/* Request payout form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D93B2F]/40"
                    placeholder="e.g. 5000"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                    disabled={requestingPayout}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    M-Pesa Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D93B2F]/40"
                    placeholder="0712345678"
                    value={payoutForm.phone}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, phone: e.target.value }))}
                    disabled={requestingPayout}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D93B2F]/40"
                    placeholder="Event name or reference"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm((f) => ({ ...f, notes: e.target.value }))}
                    disabled={requestingPayout}
                  />
                </div>
              </div>
              <Button
                className="mt-4 bg-[#D93B2F] hover:bg-[#c0342a] text-white"
                disabled={requestingPayout || !payoutForm.amount || !payoutForm.phone}
                onClick={requestPayout}
              >
                {requestingPayout ? "Submitting…" : "Request Payout"}
              </Button>
            </CardContent>
          </Card>

          {/* Payout history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payout History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {walletLoading ? (
                <TableSkeleton rows={4} />
              ) : payouts.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No payouts requested yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">M-Pesa Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Requested</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              p.status === "COMPLETED" ? "success"
                              : p.status === "PENDING" ? "warning"
                              : p.status === "FAILED" ? "destructive"
                              : "secondary"
                            }>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.mpesaRef ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(p.requestedAt)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.processedAt ? formatDateTime(p.processedAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Rewards Tab ── */}
      {tab === "rewards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{rewards.length} rewards configured</p>
            <Button variant="outline" size="sm" onClick={loadRewards} disabled={rewardsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${rewardsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {rewardsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : rewards.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Gift className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-400">No rewards configured yet.</p>
                <p className="mt-1 text-xs text-gray-400">Use the Rewards section in the main menu to create rewards.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((r) => (
                <Card key={r.id} className={r.isActive === false ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{r.name}</p>
                      {r.isActive !== undefined && (
                        <Badge variant={r.isActive ? "success" : "secondary"} className="text-xs">
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{r.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#D93B2F]">{r.pointsCost.toLocaleString()} pts</span>
                      {r.stock !== undefined && (
                        <span className="text-xs text-gray-400">Stock: {r.stock}</span>
                      )}
                    </div>
                    {r.category && (
                      <p className="mt-2 text-xs text-gray-400 uppercase tracking-wider">{r.category}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Scanner Tab ── */}
      {tab === "scanner" && (
        <div className="max-w-lg mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Web Check-in Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter the QR code from a ticket (scan with a barcode scanner or type manually).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D93B2F]/40"
                  placeholder="Paste or scan QR code here…"
                  value={qrCode}
                  onChange={(e) => { setQrCode(e.target.value); setScanResult(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") scan(); }}
                  disabled={scanning}
                  autoFocus
                />
                <Button
                  className="bg-[#D93B2F] hover:bg-[#c0342a] text-white shrink-0"
                  onClick={scan}
                  disabled={scanning || !qrCode.trim()}
                >
                  {scanning ? "Scanning…" : "Scan"}
                </Button>
              </div>

              {scanResult && (
                <div
                  className={`rounded-xl p-4 border-2 ${
                    isApproved(scanResult)
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                      : "border-red-400 bg-red-50 dark:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {isApproved(scanResult) ? (
                      <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className={`font-bold text-base ${isApproved(scanResult) ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {isApproved(scanResult) ? "ENTRY APPROVED" : "ENTRY DENIED"}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{scanResult.result}</p>
                    </div>
                  </div>

                  {scanResult.ticketHolderName && (
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Name:</span> <span className="font-semibold">{scanResult.ticketHolderName}</span></p>
                      {scanResult.tierName && (
                        <p><span className="text-gray-500">Tier:</span> <span className="font-semibold">{scanResult.tierName}</span></p>
                      )}
                      {scanResult.eventTitle && (
                        <p><span className="text-gray-500">Event:</span> <span className="font-semibold">{scanResult.eventTitle}</span></p>
                      )}
                      {scanResult.entryNumber !== undefined && (
                        <p><span className="text-gray-500">Entry #:</span> <span className="font-semibold">{scanResult.entryNumber}</span></p>
                      )}
                    </div>
                  )}

                  {scanResult.denyReason && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{scanResult.denyReason}</p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => { setQrCode(""); setScanResult(null); }}
                  >
                    Scan another
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400">
            For high-volume entry scanning, use the PartyPass mobile gate app.
          </p>
        </div>
      )}
    </div>
  );
}
