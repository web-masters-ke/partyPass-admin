"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Download, Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { eventsApi, adminTicketsApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";
import { formatDateTime, getInitials } from "@/lib/utils";
import type { LoyaltyTier } from "@/lib/types";

interface Attendee {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    loyaltyTier: LoyaltyTier;
  };
  ticketTier: {
    name: string;
    tierType: string;
  };
  status: string;
  currentStatus: string;
  entryCount: number;
  lastEntryAt?: string;
  createdAt: string;
}


const TIER_COLORS: Record<string, string> = {
  GA: "bg-gray-100 text-gray-700",
  VIP: "bg-yellow-100 text-yellow-700",
  VVIP: "bg-gray-900 text-white",
  EARLY_BIRD: "bg-green-100 text-green-700",
  GROUP: "bg-indigo-100 text-indigo-700",
};

export default function AttendeesPage() {
  const { id } = useParams<{ id: string }>();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      const res = await eventsApi.attendees(id, params);
      const data = unwrap<{ items: Attendee[]; total: number; totalPages: number }>(res);
      setAttendees(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, [id, page, search]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const checkedIn = attendees.filter((a) => a.currentStatus === "INSIDE").length;

  const voidTicket = async (ticketId: string) => {
    if (!confirm("Void this ticket? The holder will be denied entry at the gate.")) return;
    try {
      await adminTicketsApi.void(ticketId);
      setAttendees((prev) => prev.map((a) => a.id === ticketId ? { ...a, status: "VOIDED" } : a));
      toast.success("Ticket voided");
    } catch {
      toast.error("Failed to void ticket");
    }
  };

  const reinstateTicket = async (ticketId: string) => {
    try {
      await adminTicketsApi.reinstate(ticketId);
      setAttendees((prev) => prev.map((a) => a.id === ticketId ? { ...a, status: "VALID" } : a));
      toast.success("Ticket reinstated");
    } catch {
      toast.error("Failed to reinstate ticket");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attendees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total.toLocaleString()} tickets · {checkedIn} currently inside
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse border-b border-gray-200 dark:border-gray-700 last:border-0 bg-gray-50 dark:bg-gray-700/20" />
              ))}
            </div>
          ) : attendees.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No attendees found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Attendee</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Ticket Tier</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Entry Count</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Last Entry</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Purchased</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                            {getInitials(a.user.firstName, a.user.lastName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {a.user.firstName} {a.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{a.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            TIER_COLORS[a.ticketTier.tierType] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {a.ticketTier.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            a.currentStatus === "INSIDE"
                              ? "success"
                              : a.currentStatus === "DENIED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {a.currentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {a.entryCount > 0 ? (
                          <span>
                            {a.entryCount}
                            {a.entryCount > 1 && (
                              <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400">(re-entries)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Not checked in</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {a.lastEntryAt ? formatDateTime(a.lastEntryAt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDateTime(a.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === "VOIDED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => reinstateTicket(a.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Reinstate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => voidTicket(a.id)}
                          >
                            <Ban className="mr-1 h-3 w-3" />
                            Void
                          </Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
