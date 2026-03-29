"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Users,
  UserCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { adminApi, unwrap } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface VenueAnalytics {
  venue: {
    id: string;
    name: string;
    city: string;
    country: string;
    capacity?: number;
    logoUrl?: string;
    bannerUrl?: string;
    amenities: string[];
  };
  stats: {
    totalEvents: number;
    totalRevenue: number;
    totalCheckins: number;
    checkinsToday: number;
  };
  events: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    ticketsSold: number;
    revenue: number;
  }>;
  checkinsPerDay: Array<{
    date: string;
    count: number;
  }>;
}

const EVENT_STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  CANCELLED: "destructive",
  COMPLETED: "info",
};

export default function VenueAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVenueAnalytics(id);
      setData(unwrap<VenueAnalytics>(res));
    } catch {
      toast.error("Failed to load venue analytics");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="h-28 w-full rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-gray-400">
        <p>Venue not found.</p>
        <Link href="/venues">
          <Button variant="outline" className="mt-4">Back to Venues</Button>
        </Link>
      </div>
    );
  }

  const { venue, stats, events, checkinsPerDay } = data;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/venues"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Venues
      </Link>

      {/* Venue header */}
      <Card className="overflow-hidden">
        {venue.bannerUrl && (
          <div className="h-32 w-full">
            <img src={venue.bannerUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {venue.logoUrl ? (
              <img
                src={venue.logoUrl}
                alt={venue.name}
                className="h-14 w-14 rounded-xl object-cover border-2 border-gray-100 dark:border-gray-700 shrink-0"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#D93B2F]/10 text-xl font-bold text-[#D93B2F]">
                {venue.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{venue.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                {venue.city}, {venue.country}
              </div>
              {venue.capacity && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Capacity: {venue.capacity.toLocaleString()}
                </p>
              )}
              {venue.amenities?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {venue.amenities.slice(0, 5).map((a) => (
                    <span
                      key={a}
                      className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                  {venue.amenities.length > 5 && (
                    <span className="text-[10px] text-gray-400">
                      +{venue.amenities.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Events"
          value={stats.totalEvents.toLocaleString()}
          icon={CalendarDays}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Total Check-ins"
          value={stats.totalCheckins.toLocaleString()}
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Check-ins Today"
          value={stats.checkinsToday.toLocaleString()}
          icon={UserCheck}
          iconBg="bg-[#D93B2F]/10"
          iconColor="text-[#D93B2F]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Events at venue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Events at this Venue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No events at this venue yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Event</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Date</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Tickets</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr
                          key={ev.id}
                          className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/events/${ev.id}`}
                              className="font-medium text-gray-900 dark:text-gray-100 hover:text-[#D93B2F] transition-colors truncate block max-w-[180px]"
                            >
                              {ev.title}
                            </Link>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Check-ins per day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-ins (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {checkinsPerDay.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No check-in data</div>
            ) : (
              <div className="space-y-2">
                {checkinsPerDay.map((day) => {
                  const max = Math.max(...checkinsPerDay.map((d) => d.count), 1);
                  const pct = Math.round((day.count / max) * 100);
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <p className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(day.date, "EEE MMM d")}
                      </p>
                      <div className="flex-1 h-5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#D93B2F]/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="w-10 shrink-0 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {day.count.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
