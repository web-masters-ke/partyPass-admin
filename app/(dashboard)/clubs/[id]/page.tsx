"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import api, { unwrap } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ClubNight {
  id: string;
  name: string;
  description?: string;
  dayOfWeek: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
}

interface Member {
  id: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl?: string };
}

interface ClubDetail {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city: string;
  address?: string;
  capacity?: number;
  amenities: string[];
  upcomingEventsCount: number;
  membershipCount: number;
  clubNightsCount: number;
  isActive: boolean;
  clubNights: ClubNight[];
  clubMemberships: Member[];
  owner?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/clubs/${id}`)
      .then((r) => setClub(unwrap<ClubDetail>(r)))
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleNight = async (nightId: string) => {
    try {
      await api.patch(`/admin/clubs/nights/${nightId}/toggle`);
      setClub((prev) =>
        prev
          ? {
              ...prev,
              clubNights: prev.clubNights.map((n) =>
                n.id === nightId ? { ...n, isActive: !n.isActive } : n
              ),
            }
          : null
      );
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">Club not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/clubs">Back to Clubs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clubs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D93B2F]/10 overflow-hidden flex-shrink-0">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6 text-[#D93B2F]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {club.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              {club.address || club.city}
              {club.owner && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  · Owner: {club.owner.firstName} {club.owner.lastName}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  club.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                )}
              >
                {club.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Capacity", value: club.capacity ?? "—" },
          { label: "Upcoming Events", value: club.upcomingEventsCount },
          { label: "Members", value: club.membershipCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center"
          >
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nights">
            Club Nights ({club.clubNights.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            Members ({club.membershipCount})
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {club.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                  Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {club.amenities?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {club.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No amenities listed.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Club Nights */}
        <TabsContent value="nights" className="mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                Club Nights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {club.clubNights.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No club nights configured.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {club.clubNights.map((night) => (
                    <div
                      key={night.id}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {night.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {DAYS[night.dayOfWeek]} &bull; {night.startTime}
                          {night.endTime ? ` — ${night.endTime}` : ""}
                        </p>
                        {night.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {night.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            night.isActive
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-400 dark:text-gray-500"
                          )}
                        >
                          {night.isActive ? "Active" : "Paused"}
                        </span>
                        <Switch
                          checked={night.isActive}
                          onCheckedChange={() => toggleNight(night.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {club.clubMemberships.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No members yet.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {club.clubMemberships.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F] overflow-hidden flex-shrink-0">
                        {m.user.avatarUrl ? (
                          <img
                            src={m.user.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          `${m.user.firstName.charAt(0)}${m.user.lastName.charAt(0)}`
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {m.user.firstName} {m.user.lastName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Joined {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
