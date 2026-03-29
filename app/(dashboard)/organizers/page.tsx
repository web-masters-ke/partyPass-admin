"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, RefreshCw, Users2, DollarSign, Clock,
  CalendarDays, UserPlus, Mail, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/stats-card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminApi, unwrap } from "@/lib/api";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

interface OrganizerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
  eventsCount: number;
  grossRevenue: number;
  pendingPayout: number;
}

interface OrganizersOverview {
  totalOrganizers: number;
  platformRevenue: number;
  pendingPayouts: number;
  activeEvents: number;
}

const PAGE_SIZE = 20;

const ROLE_BADGE: Record<string, string> = {
  ORGANIZER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CLUB_OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<OrganizerRow[]>([]);
  const [overview, setOverview] = useState<OrganizersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", role: "ORGANIZER", message: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      const res = await adminApi.getOrganizers(params);
      const data = unwrap<{
        items: OrganizerRow[];
        total: number;
        totalPages: number;
        overview: OrganizersOverview;
      }>(res);
      setOrganizers(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      if (data.overview) setOverview(data.overview);
    } catch {
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => { setPage(1); }, [search]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName) {
      setInviteMsg({ type: "error", text: "Email and first name are required." });
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    try {
      await adminApi.inviteOrganizer(inviteForm);
      setInviteMsg({ type: "success", text: `Invitation sent to ${inviteForm.email}!` });
      setInviteForm({ email: "", firstName: "", lastName: "", role: "ORGANIZER", message: "" });
      setTimeout(() => { setInviteOpen(false); setInviteMsg(null); }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to send invitation.";
      setInviteMsg({ type: "error", text: msg });
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organizers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total.toLocaleString()} total organizers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-[#D93B2F] hover:bg-[#b52e24] gap-1.5"
            onClick={() => { setInviteOpen(true); setInviteMsg(null); }}>
            <UserPlus className="h-4 w-4" />
            Invite Organizer
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {loading && !overview ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatsCard
            title="Total Organizers"
            value={(overview?.totalOrganizers ?? total).toLocaleString()}
            icon={Users2}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Platform Revenue (5%)"
            value={formatCurrency(overview?.platformRevenue ?? 0)}
            icon={DollarSign}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Pending Payouts"
            value={formatCurrency(overview?.pendingPayouts ?? 0)}
            icon={Clock}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Active Events"
            value={(overview?.activeEvents ?? 0).toLocaleString()}
            icon={CalendarDays}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/20"
                />
              ))}
            </div>
          ) : organizers.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              <Users2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No organizers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Organizer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Role
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                      Events
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                      Gross Revenue
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                      Net Earnings
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">
                      Pending Payout
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => {
                    const netEarnings = (org.grossRevenue ?? 0) * 0.95;
                    return (
                      <tr
                        key={org.id}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                      >
                        {/* Organizer */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                              {getInitials(org.firstName, org.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {org.firstName} {org.lastName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{org.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              ROLE_BADGE[org.role] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {org.role.replace("_", " ")}
                          </span>
                        </td>
                        {/* Events */}
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                          {(org.eventsCount ?? 0).toLocaleString()}
                        </td>
                        {/* Gross Revenue */}
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(org.grossRevenue ?? 0)}
                        </td>
                        {/* Net Earnings */}
                        <td className="px-4 py-3 text-right text-green-700 dark:text-green-400 font-semibold">
                          {formatCurrency(netEarnings)}
                        </td>
                        {/* Pending Payout */}
                        <td className="px-4 py-3 text-right">
                          {(org.pendingPayout ?? 0) > 0 ? (
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {formatCurrency(org.pendingPayout ?? 0)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(org.createdAt)}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={org.isBanned ? "destructive" : "success"}>
                            {org.isBanned ? "Banned" : "Active"}
                          </Badge>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <Link href={`/organizers/${org.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Invite Organizer Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Mail className="w-4 h-4 text-[#D93B2F]" />
              Invite Organizer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">First Name *</Label>
                <Input
                  placeholder="Jane"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Email Address *</Label>
              <Input
                type="email"
                placeholder="organizer@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="ORGANIZER">Organizer — event management</SelectItem>
                  <SelectItem value="CLUB_OWNER">Club Owner — venue + recurring nights</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Personal message (optional)</Label>
              <textarea
                rows={2}
                placeholder="We'd love to have you on PartyPass…"
                value={inviteForm.message}
                onChange={(e) => setInviteForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#D93B2F]"
              />
            </div>

            {inviteMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
                inviteMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                {inviteMsg.type === "success" ? "✓" : "✗"} {inviteMsg.text}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => setInviteOpen(false)} disabled={inviting}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviting}
                className="flex-1 bg-[#D93B2F] hover:bg-[#b52e24] text-white">
                {inviting ? "Sending…" : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
