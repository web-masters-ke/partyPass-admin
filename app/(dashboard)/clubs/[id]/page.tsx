"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Calendar,
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import api, { unwrap } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ClubDetail {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city: string;
  address?: string;
  capacity: number;
  amenities: string[];
  upcomingEventsCount: number;
  membershipCount: number;
  isActive: boolean;
}

interface ClubNight {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  isActive: boolean;
}

interface TableConfig {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  location?: string;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

const TABLE_STATUS_COLORS = {
  AVAILABLE: "bg-green-400",
  OCCUPIED: "bg-red-400",
  RESERVED: "bg-yellow-400",
};

const mockClub: ClubDetail = {
  id: "c1",
  name: "Altitude The Club",
  description:
    "Nairobi's premier rooftop nightclub featuring panoramic views of the city skyline, world-class DJs, and premium bottle service.",
  city: "Nairobi",
  address: "14 Upperhill Road, Nairobi, Kenya",
  capacity: 500,
  amenities: ["VIP Lounge", "Rooftop Access", "Private Booths", "Premium Bar", "Coat Check"],
  upcomingEventsCount: 4,
  membershipCount: 234,
  isActive: true,
};

const mockNights: ClubNight[] = [
  { id: "n1", name: "Afro Fridays", dayOfWeek: "FRIDAY", startTime: "21:00", isActive: true },
  { id: "n2", name: "Reggae Saturdays", dayOfWeek: "SATURDAY", startTime: "22:00", isActive: true },
  { id: "n3", name: "House Sundays", dayOfWeek: "SUNDAY", startTime: "20:00", isActive: false },
];

const mockTables: TableConfig[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  tableNumber: `T${i + 1}`,
  capacity: i < 4 ? 2 : i < 8 ? 4 : 8,
  status: (["AVAILABLE", "OCCUPIED", "RESERVED"] as const)[Math.floor(Math.random() * 3)],
  location: i < 4 ? "Main Floor" : i < 8 ? "VIP Section" : "Rooftop",
}));

const mockStaff: StaffMember[] = [
  { id: "s1", firstName: "James", lastName: "Mwangi", role: "GATE_STAFF", isActive: true },
  { id: "s2", firstName: "Mercy", lastName: "Ochieng", role: "BARTENDER", isActive: true },
  { id: "s3", firstName: "Kevin", lastName: "Otieno", role: "SECURITY", isActive: true },
  { id: "s4", firstName: "Faith", lastName: "Njeri", role: "MANAGER", isActive: false },
];

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [nights, setNights] = useState<ClubNight[]>(mockNights);
  const [tables] = useState<TableConfig[]>(mockTables);
  const [staff] = useState<StaffMember[]>(mockStaff);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/clubs/${id}`);
        setClub(unwrap<ClubDetail>(res));
      } catch {
        setClub(mockClub);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleNightStatus = (nightId: string) => {
    setNights((prev) =>
      prev.map((n) => (n.id === nightId ? { ...n, isActive: !n.isActive } : n))
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D93B2F]/10">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-[#D93B2F]" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{club.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              {club.address || club.city}
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold",
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
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{club.capacity}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{club.upcomingEventsCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{club.membershipCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nights">Club Nights</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">{club.description}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                  Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Club Nights */}
        <TabsContent value="nights" className="mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                Club Nights
              </CardTitle>
              <Button size="sm" className="bg-[#D93B2F] hover:bg-[#c0392b] text-white">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Night
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {nights.map((night) => (
                  <div
                    key={night.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{night.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {night.dayOfWeek} &bull; {night.startTime}
                      </p>
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
                        onCheckedChange={() => toggleNightStatus(night.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables */}
        <TabsContent value="tables" className="mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                Floor Plan — Table Status
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                {(["AVAILABLE", "OCCUPIED", "RESERVED"] as const).map((status) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={cn("h-3 w-3 rounded", TABLE_STATUS_COLORS[status])} />
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    className={cn(
                      "rounded-xl p-3 text-center text-white transition-opacity hover:opacity-80",
                      TABLE_STATUS_COLORS[table.status]
                    )}
                    title={`${table.tableNumber} — ${table.status} — Capacity: ${table.capacity}`}
                  >
                    <p className="font-bold text-sm">{table.tableNumber}</p>
                    <p className="text-xs opacity-80">{table.capacity}p</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff */}
        <TabsContent value="staff" className="mt-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-gray-700 dark:text-gray-300">
                Staff Roster
              </CardTitle>
              <Button size="sm" className="bg-[#D93B2F] hover:bg-[#c0392b] text-white">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D93B2F]/10 text-xs font-bold text-[#D93B2F]">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {member.firstName} {member.lastName}
                      </p>
                      <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        {member.role.replace("_", " ")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        member.isActive ? "bg-green-500" : "bg-gray-300"
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
