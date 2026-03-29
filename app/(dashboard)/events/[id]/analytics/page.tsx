"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventsApi, unwrap } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface EventAnalytics {
  totalRevenue: number;
  totalTicketsSold: number;
  checkInRate: number;
  revenueOverTime: Array<{ date: string; revenue: number }>;
  tierBreakdown: Array<{ name: string; sold: number; total: number; revenue: number }>;
  salesByHour: Array<{ hour: string; sales: number }>;
  topPromoCodes: Array<{ code: string; uses: number; discount: number }>;
}

// Mock analytics data
const mockAnalytics: EventAnalytics = {
  totalRevenue: 547800,
  totalTicketsSold: 423,
  checkInRate: 87,
  revenueOverTime: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString("en", { month: "short", day: "numeric" }),
    revenue: Math.floor(Math.random() * 60000 + 10000),
  })),
  tierBreakdown: [
    { name: "General Admission", sold: 280, total: 300, revenue: 140000 },
    { name: "VIP", sold: 95, total: 100, revenue: 285000 },
    { name: "VVIP", sold: 48, total: 50, revenue: 122800 },
  ],
  salesByHour: [
    { hour: "8am", sales: 12 },
    { hour: "10am", sales: 28 },
    { hour: "12pm", sales: 45 },
    { hour: "2pm", sales: 67 },
    { hour: "4pm", sales: 89 },
    { hour: "6pm", sales: 102 },
    { hour: "8pm", sales: 45 },
    { hour: "10pm", sales: 23 },
  ],
  topPromoCodes: [
    { code: "EARLYBIRD20", uses: 45, discount: 20 },
    { code: "VIPFRIENDS", uses: 12, discount: 15 },
    { code: "STAFF50", uses: 8, discount: 50 },
  ],
};

export default function EventAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await eventsApi.analytics(id);
        setAnalytics(unwrap<EventAnalytics>(res));
      } catch {
        setAnalytics(mockAnalytics);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const data = analytics ?? mockAnalytics;

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/events/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Event Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Performance metrics and sales data</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(data.totalRevenue)}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gross Revenue</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.totalTicketsSold}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tickets Sold</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400">{data.checkInRate}%</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check-in Rate</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.revenueOverTime} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D93B2F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D93B2F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D93B2F"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tier breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Tier Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.tierBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}
                />
                <Bar dataKey="sold" fill="#D93B2F" name="Sold" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#E5E7EB" name="Available" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by hour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.salesByHour} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6366F1" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Promo codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Promo Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPromoCodes.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No promo codes used</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left font-semibold text-gray-600 dark:text-gray-400">Code</th>
                    <th className="pb-3 text-center font-semibold text-gray-600 dark:text-gray-400">Uses</th>
                    <th className="pb-3 text-right font-semibold text-gray-600 dark:text-gray-400">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPromoCodes.map((code) => (
                    <tr key={code.code} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <td className="py-2.5">
                        <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {code.code}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-medium text-gray-900 dark:text-gray-100">{code.uses}</td>
                      <td className="py-2.5 text-right text-gray-700 dark:text-gray-300">{code.discount}% off</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
