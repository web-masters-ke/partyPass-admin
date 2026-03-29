"use client";

import Link from "next/link";
import { Eye, Edit, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Event, EventStatus } from "@/lib/types";

interface EventsTableProps {
  events: Event[];
  loading?: boolean;
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
  return (
    <Badge variant={variantMap[status]}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export function EventsTable({ events, loading }: EventsTableProps) {
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
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Event Name</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Date</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Venue</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Category</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Tickets</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
            <th className="pb-3 pr-4 font-semibold text-gray-600 dark:text-gray-400">Status</th>
            <th className="pb-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {event.coverImageUrl ? (
                    <img
                      src={event.coverImageUrl}
                      alt={event.title}
                      className="h-8 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-12 rounded bg-[#D93B2F]/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#D93B2F]">
                        {event.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate">
                    {event.title}
                  </span>
                </div>
              </td>
              <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                {formatDate(event.startDateTime)}
              </td>
              <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                {event.venueId ? "Venue" : event.isOnline ? "Online" : "TBD"}
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
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/events/${event.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/events/${event.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  {(event.status === "ONGOING" || event.status === "PUBLISHED") && (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/events/${event.id}/gate`}>
                        <Radio className="h-4 w-4 text-[#D93B2F]" />
                      </Link>
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
