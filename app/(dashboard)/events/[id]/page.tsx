"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  DollarSign,
  Radio,
  BarChart2,
  Edit,
  CheckCircle,
} from "lucide-react";

const TIER_TYPE_LABELS: Record<string, string> = {
  GA: "General Admission",
  EARLY_BIRD: "Early Bird",
  VIP: "VIP",
  VVIP: "VVIP",
  TABLE: "Table",
  GROUP: "Group",
  BACKSTAGE: "Backstage",
  PRESS: "Press",
  COMP: "Complimentary",
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { eventsApi, unwrap } from "@/lib/api";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { Event } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await eventsApi.get(id);
        setEvent(unwrap<Event>(res));
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold text-gray-700">Event not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  const soldPct = Math.round(((event.ticketsSold ?? 0) / event.maxCapacity) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-20 w-32 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-xl bg-[#D93B2F]/10">
              <CalendarDays className="h-8 w-8 text-[#D93B2F]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{event.title}</h1>
              {event.status === "ONGOING" && (
                <Badge className="animate-pulse bg-[#D93B2F] text-white">LIVE</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatDateTime(event.startDateTime)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{event.category.replace("_", " ")}</Badge>
              <Badge
                variant={
                  event.status === "PUBLISHED"
                    ? "published"
                    : event.status === "DRAFT"
                    ? "draft"
                    : event.status === "ONGOING"
                    ? "ongoing"
                    : event.status === "CANCELLED"
                    ? "cancelled"
                    : "past"
                }
              >
                {event.status}
              </Badge>
              {event.isOnline && <Badge variant="info">Online</Badge>}
              {event.isPrivate && <Badge variant="secondary">Private</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${id}/attendees`}>
              <Users className="mr-2 h-4 w-4" />
              Attendees
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/events/${id}/analytics`}>
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          {(event.status === "ONGOING" || event.status === "PUBLISHED") && (
            <Button asChild size="sm">
              <Link href={`/events/${id}/gate`}>
                <Radio className="mr-2 h-4 w-4" />
                Gate Live
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {event.ticketsSold ?? 0} / {event.maxCapacity}
                </p>
                <div className="mt-2">
                  <Progress value={soldPct} className="h-2" />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{soldPct}% sold</p>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gross Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(event.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Tiers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {event.ticketTiers?.length ?? 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description + tiers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Start</span>
              <span className="font-medium dark:text-gray-200">{formatDateTime(event.startDateTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">End</span>
              <span className="font-medium dark:text-gray-200">{formatDateTime(event.endDateTime)}</span>
            </div>
            {event.doorsOpenAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Doors Open</span>
                <span className="font-medium dark:text-gray-200">{formatDateTime(event.doorsOpenAt)}</span>
              </div>
            )}
            {event.ageRestriction && event.ageRestriction > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Age Restriction</span>
                <span className="font-medium dark:text-gray-200">{event.ageRestriction}+</span>
              </div>
            )}
            {event.dressCode && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Dress Code</span>
                <span className="font-medium dark:text-gray-200">{event.dressCode}</span>
              </div>
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Description</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{event.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ticket tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            {event.ticketTiers && event.ticketTiers.length > 0 ? (
              <div className="space-y-3">
                {event.ticketTiers.map((tier) => {
                  const remaining = (tier.totalQuantity ?? 0) - (tier.soldCount ?? 0);
                  const soldPct = tier.totalQuantity
                    ? Math.round(((tier.soldCount ?? 0) / tier.totalQuantity) * 100)
                    : 0;
                  const tierColor = (tier as any).color ?? "#D93B2F";
                  return (
                    <div
                      key={tier.id}
                      className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex">
                        {/* Event image thumbnail */}
                        <div className="relative w-20 flex-shrink-0">
                          {event.coverImageUrl ? (
                            <img
                              src={event.coverImageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{ minHeight: 88 }}
                            />
                          ) : (
                            <div
                              className="flex h-full w-full min-h-[88px] items-center justify-center text-2xl"
                              style={{ background: `${tierColor}22` }}
                            >
                              🎟️
                            </div>
                          )}
                          {/* Tier color strip */}
                          <div
                            className="absolute inset-y-0 right-0 w-1.5"
                            style={{ background: tierColor }}
                          />
                        </div>
                        {/* Tier info */}
                        <div className="flex flex-1 flex-col justify-between p-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {tier.name}
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                style={{ background: tierColor }}
                              >
                                {TIER_TYPE_LABELS[tier.tierType] ?? tier.tierType}
                              </span>
                              {remaining === 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                  SOLD OUT
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm font-black" style={{ color: tierColor }}>
                              {formatCurrency(tier.price)}
                            </p>
                          </div>
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{tier.soldCount ?? 0} sold</span>
                              <span>{remaining} left of {tier.totalQuantity}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${soldPct}%`, background: tierColor }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No ticket tiers configured</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
