"use client";

import Link from "next/link";
import { useState } from "react";

function EventThumb({ url, title }: { url?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        className="h-8 w-12 rounded object-cover flex-shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="h-8 w-12 rounded bg-[#D93B2F]/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-[#D93B2F]">{title.charAt(0).toUpperCase()}</span>
    </div>
  );
}
import { Eye, Edit, Radio, Globe, XCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { eventsApi } from "@/lib/api";
import type { Event, EventStatus } from "@/lib/types";
import toast from "react-hot-toast";

interface EventsTableProps {
  events: Event[];
  loading?: boolean;
  onRefresh?: () => void;
}

function StatusBadge({ status }: { status: EventStatus }) {
  const variantMap: Record<EventStatus, "draft" | "published" | "ongoing" | "cancelled" | "past" | "presale" | "sold_out" | "postponed"> = {
    DRAFT: "draft",
    PUBLISHED: "published",
    ONGOING: "ongoing",
    CANCELLED: "cancelled",
    PAST: "past",
    PRESALE: "presale",
    SOLD_OUT: "sold_out",
    POSTPONED: "postponed",
  };
  return <Badge variant={variantMap[status]}>{status.replace("_", " ")}</Badge>;
}

export function EventsTable({ events, loading, onRefresh }: EventsTableProps) {
  const [acting, setActing] = useState<string | null>(null);

  async function publish(id: string) {
    setActing(id);
    try {
      await eventsApi.publish(id);
      toast.success("Event published");
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to publish");
    } finally {
      setActing(null);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Cancel this event? Attendees will be notified.")) return;
    setActing(id);
    try {
      await eventsApi.cancel(id);
      toast.success("Event cancelled");
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to cancel");
    } finally {
      setActing(null);
    }
  }

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setActing(id);
    try {
      await eventsApi.delete(id);
      toast.success("Event deleted");
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to delete");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Event</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Date</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Category</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Tickets</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
            <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const busy = acting === event.id;
            const canPublish = event.status === "DRAFT" || event.status === "PRESALE";
            const canCancel = event.status === "PUBLISHED" || event.status === "ONGOING" || event.status === "PRESALE";
            const canDelete = event.status === "DRAFT" || event.status === "CANCELLED";

            return (
              <tr
                key={event.id}
                className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <EventThumb url={event.coverImageUrl} title={event.title} />
                    <span className="font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate">
                      {event.title}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(event.startDateTime)}
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {event.category.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{event.ticketsSold ?? 0}</span>
                  <span className="text-gray-400 dark:text-gray-500">/{event.maxCapacity}</span>
                </td>
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(event.totalRevenue ?? 0)}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={event.status} />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild title="View">
                      <Link href={`/events/${event.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button variant="ghost" size="icon" asChild title="Edit">
                      <Link href={`/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>

                    {(event.status === "ONGOING" || event.status === "PUBLISHED") && (
                      <Button variant="ghost" size="icon" asChild title="Gate">
                        <Link href={`/events/${event.id}/gate`}>
                          <Radio className="h-4 w-4 text-[#D93B2F]" />
                        </Link>
                      </Button>
                    )}

                    {canPublish && (
                      <Button variant="ghost" size="icon" disabled={busy} title="Publish"
                        onClick={() => publish(event.id)}>
                        <Globe className="h-4 w-4 text-green-600" />
                      </Button>
                    )}

                    {canCancel && (
                      <Button variant="ghost" size="icon" disabled={busy} title="Cancel event"
                        onClick={() => cancel(event.id)}>
                        <XCircle className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}

                    {canDelete && (
                      <Button variant="ghost" size="icon" disabled={busy} title="Delete"
                        onClick={() => deleteEvent(event.id, event.title)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
