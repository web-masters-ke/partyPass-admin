"use client";

import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Event, EventStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClasses: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  PUBLISHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PRESALE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  SOLD_OUT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ONGOING: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  POSTPONED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  PAST: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
};

interface EventCardProps {
  event: Event;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover image */}
      {!compact && (
        <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D93B2F]/20 to-[#D93B2F]/5">
              <span className="text-4xl font-bold text-[#D93B2F]/40">
                {event.title.charAt(0)}
              </span>
            </div>
          )}
          <span
            className={cn(
              "absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-semibold",
              statusClasses[event.status]
            )}
          >
            {event.status.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-[#D93B2F] transition-colors">
            {event.title}
          </h3>
          {compact && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                statusClasses[event.status]
              )}
            >
              {event.status.replace("_", " ")}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.startDateTime)}
          </div>
          {event.venueId && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              {event.isOnline ? "Online" : "Venue"}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Ticket className="h-3.5 w-3.5" />
            {event.ticketsSold ?? 0}/{event.maxCapacity} tickets sold
          </div>
        </div>

        {!compact && event.totalRevenue !== undefined && (
          <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(event.totalRevenue)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">revenue</span>
          </div>
        )}
      </div>
    </Link>
  );
}
