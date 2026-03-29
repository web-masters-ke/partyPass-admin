"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GateDashboardComponent } from "@/components/gate-dashboard";
import { eventsApi, unwrap } from "@/lib/api";
import type { Event } from "@/lib/types";

export default function GateDashboardPage() {
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
        <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {event?.title ?? "Gate Dashboard"}
              </h1>
              <Badge className="animate-pulse bg-[#D93B2F] text-white text-xs">
                <Radio className="mr-1 h-3 w-3" />
                LIVE
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Real-time gate entries • Capacity: {event?.maxCapacity?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Gate dashboard */}
      <GateDashboardComponent
        eventId={id}
        initialData={null}
      />
    </div>
  );
}
