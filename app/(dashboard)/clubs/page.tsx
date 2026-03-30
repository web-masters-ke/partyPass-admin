"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Users, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { unwrap } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Club {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city: string;
  address?: string;
  capacity: number;
  upcomingEventsCount: number;
  membershipCount: number;
  clubNightsCount?: number;
  isActive: boolean;
  owner?: { id: string; firstName: string; lastName: string; email: string } | null;
}


export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadClubs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/clubs");
      const data = unwrap<{ items: Club[] }>(res);
      setClubs(data.items ?? []);
    } catch {
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const filtered = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clubs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clubs.length} registered venues
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadClubs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Club grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No clubs found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <Card className="group cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-5">
                  {/* Logo / placeholder */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                        "bg-[#D93B2F]/10"
                      )}
                    >
                      {club.logoUrl ? (
                        <img
                          src={club.logoUrl}
                          alt={club.name}
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-[#D93B2F]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#D93B2F] transition-colors truncate">
                        {club.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {club.city}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0 mt-2",
                        club.isActive ? "bg-green-500" : "bg-gray-300"
                      )}
                    />
                  </div>

                  {club.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {club.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(club.capacity ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Capacity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {club.upcomingEventsCount}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {club.membershipCount}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
