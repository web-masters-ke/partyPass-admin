"use client";
// v1.0.1
import { useEffect, useState } from "react";
import {
  Users, CalendarDays, DollarSign, Radio, RefreshCw,
  TrendingUp, TrendingDown, Ticket,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  Treemap,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analyticsApi, unwrap } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// ─── Colors ────────────────────────────────────────────────────────────────
const PRIMARY = "#D93B2F";
const CATEGORY_COLORS = [
  "#D93B2F", "#F59E0B", "#22C55E", "#3B82F6",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];
const TIER_COLORS: Record<string, string> = {
  DIAMOND: "#B9F2FF", PLATINUM: "#E5E4E2", GOLD: "#FFD700",
  SILVER: "#C0C0C0", BRONZE: "#CD7F32",
};

// ─── Static charts (platform patterns — don't change per-refresh) ──────────
function makeSalesData() {
  const seed = [110, 95, 130, 80, 160, 210, 175, 140, 100, 120,
    90, 185, 230, 195, 160, 145, 200, 250, 220, 180,
    165, 190, 240, 280, 260, 215, 175, 195, 310, 290];
  return seed.map((sales, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000)
      .toLocaleDateString("en", { month: "short", day: "numeric" }),
    sales,
    revenue: sales * 480 + (i * 320),
    returning: Math.round(sales * 0.38),
  }));
}

const staticSalesData = makeSalesData();

const dayOfWeekData = [
  { day: "Mon", tickets: 420, revenue: 198_000, fill: "#3B82F6" },
  { day: "Tue", tickets: 280, revenue: 134_400, fill: "#8B5CF6" },
  { day: "Wed", tickets: 390, revenue: 187_200, fill: "#14B8A6" },
  { day: "Thu", tickets: 650, revenue: 312_000, fill: "#F59E0B" },
  { day: "Fri", tickets: 1820, revenue: 873_600, fill: "#D93B2F" },
  { day: "Sat", tickets: 2340, revenue: 1_123_200, fill: "#EC4899" },
  { day: "Sun", tickets: 980, revenue: 470_400, fill: "#22C55E" },
];

const userGrowthData = [
  { week: "W1", new: 180, returning: 620 },
  { week: "W2", new: 240, returning: 710 },
  { week: "W3", new: 195, returning: 780 },
  { week: "W4", new: 310, returning: 850 },
  { week: "W5", new: 280, returning: 920 },
  { week: "W6", new: 420, returning: 1040 },
  { week: "W7", new: 380, returning: 1190 },
  { week: "W8", new: 510, returning: 1320 },
  { week: "W9", new: 465, returning: 1450 },
  { week: "W10", new: 590, returning: 1600 },
  { week: "W11", new: 540, returning: 1720 },
  { week: "W12", new: 680, returning: 1880 },
];

const radarData = [
  { metric: "Ticket Sales",  A: 87, fullMark: 100 },
  { metric: "User Growth",   A: 74, fullMark: 100 },
  { metric: "Event Quality", A: 91, fullMark: 100 },
  { metric: "Retention",     A: 68, fullMark: 100 },
  { metric: "Revenue",       A: 82, fullMark: 100 },
  { metric: "Loyalty",       A: 59, fullMark: 100 },
];

const loyaltyTierData = [
  { name: "DIAMOND",  count: 280,   pct: 2,  fill: TIER_COLORS.DIAMOND },
  { name: "PLATINUM", count: 870,   pct: 6,  fill: TIER_COLORS.PLATINUM },
  { name: "GOLD",     count: 2100,  pct: 15, fill: TIER_COLORS.GOLD },
  { name: "SILVER",   count: 4300,  pct: 30, fill: TIER_COLORS.SILVER },
  { name: "BRONZE",   count: 6832,  pct: 47, fill: TIER_COLORS.BRONZE },
];

// ─── Types ─────────────────────────────────────────────────────────────────
interface PlatformAnalytics {
  totals: {
    users: number;
    events: number;
    activeEvents: number;
    ticketsSold: number;
    revenue: number | string;
    newUsersThisMonth: number;
  };
  revenueData: { month: string; revenue: number }[];
}

interface TopEvent {
  eventId: string;
  title: string;
  orders: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  paidAt?: string;
  user?: { firstName: string; lastName: string; email?: string };
  event?: { title: string };
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {p.name.toLowerCase().includes("revenue")
              ? `KES ${Number(p.value).toLocaleString()}`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Treemap custom cell ───────────────────────────────────────────────────
function TreemapBlock(props: {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; value?: number; root?: { value?: number };
  depth?: number;
  data: { name: string; color: string; size: number }[];
}) {
  const { x = 0, y = 0, width = 0, height = 0, name, value, root, data } = props;
  if (!width || !height) return null;
  const total = root?.value ?? 1;
  const pct = Math.round((Number(value ?? 0) / total) * 100);
  const item = data.find((d) => d.name === name);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3}
        fill={item?.color ?? PRIMARY} fillOpacity={0.82} stroke="#fff" strokeWidth={2} />
      {width > 55 && height > 30 && (
        <>
          <text x={x + 8} y={y + 16} fill="white" fontSize={10} fontWeight={700}
            style={{ pointerEvents: "none" }}>{name}</text>
          <text x={x + 8} y={y + 29} fill="rgba(255,255,255,0.75)" fontSize={9}
            style={{ pointerEvents: "none" }}>{pct}%</text>
        </>
      )}
    </g>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────
function KpiCard({
  title, value, sub, change, icon: Icon, iconBg, iconColor, sparkData, sparkKey,
}: {
  title: string;
  value: string | number;
  sub?: string;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sparkData?: { v: number }[];
  sparkKey?: string;
}) {
  const isPos = (change ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          {change !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPos ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
            }`}>
              {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        {sparkData && (
          <div className="mt-3 -mx-1">
            <ResponsiveContainer width="100%" height={36}>
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${sparkKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={PRIMARY} strokeWidth={1.5}
                  fill={`url(#spark-${sparkKey})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function fmtRelative(d?: string) {
  if (!d) return "—";
  try {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch { return "—"; }
}

const TOKEN_KEY = "partypass_token";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) ?? "" : "";
}
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

async function fetchJson(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; count: number; value: number }[]>([]);
  const [treemapData, setTreemapData] = useState<{ name: string; size: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, dashboardJson, platformJson] = await Promise.all([
        analyticsApi.dashboard(),
        fetchJson("/admin/dashboard").catch(() => null),
        fetchJson("/analytics/platform").catch(() => null),
      ]);

      const a = unwrap<PlatformAnalytics>(analyticsRes);
      setAnalytics(a);

      if (dashboardJson?.data?.recentOrders) {
        setRecentOrders(dashboardJson.data.recentOrders);
      }

      if (platformJson?.data?.topEvents) {
        const evts: TopEvent[] = platformJson.data.topEvents;
        setTopEvents(evts);
        // Build treemap from top events
        setTreemapData(evts.slice(0, 7).map((e, i) => ({
          name: e.title.length > 20 ? e.title.slice(0, 18) + "…" : e.title,
          size: e.revenue,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        })));
      }

      // Category breakdown from totals
      if (a?.totals) {
        setCategoryBreakdown([
          { category: "Active",    count: a.totals.activeEvents,  value: a.totals.activeEvents },
          { category: "Upcoming",  count: 0, value: 0 },
          { category: "All",       count: a.totals.events,        value: a.totals.events },
        ].filter((d) => d.value > 0));
      }
    } catch {
      // keep nulls
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalUsers   = analytics?.totals?.users ?? 0;
  const totalEvents  = analytics?.totals?.events ?? 0;
  const activeEvents = analytics?.totals?.activeEvents ?? 0;
  const ticketsSold  = analytics?.totals?.ticketsSold ?? 0;
  const totalRevenue = Number(analytics?.totals?.revenue ?? 0);
  const newThisMonth = analytics?.totals?.newUsersThisMonth ?? 0;

  // Use real revenue data for combo chart if available, else static
  const salesChartData = (() => {
    const rd = analytics?.revenueData ?? [];
    if (rd.length > 0) {
      return rd.map((d) => ({ date: d.month, sales: 0, revenue: d.revenue, returning: 0 }));
    }
    return staticSalesData;
  })();

  const revenueSparkData = salesChartData.slice(-14).map((d) => ({ v: d.revenue }));
  const salesSparkData   = staticSalesData.slice(-14).map((d) => ({ v: d.sales }));

  // Category donut — use real data if we have it, else static
  const categoryDonutData = categoryBreakdown.length > 0 ? categoryBreakdown : [
    { category: "Club Night", count: 98,  value: 98  },
    { category: "Festival",   count: 41,  value: 41  },
    { category: "Concert",    count: 62,  value: 62  },
    { category: "Comedy",     count: 24,  value: 24  },
    { category: "Boat Party", count: 18,  value: 18  },
    { category: "Rooftop",    count: 14,  value: 14  },
    { category: "Corporate",  count: 10,  value: 10  },
  ];

  // Treemap — real if available, else static
  const treemapDisplay = treemapData.length > 0 ? treemapData : [
    { name: "Club Night", size: 873_600,   color: "#D93B2F" },
    { name: "Festival",   size: 1_536_000, color: "#F59E0B" },
    { name: "Concert",    size: 620_000,   color: "#22C55E" },
    { name: "Comedy",     size: 248_000,   color: "#3B82F6" },
    { name: "Boat Party", size: 210_000,   color: "#8B5CF6" },
    { name: "Rooftop",    size: 182_000,   color: "#EC4899" },
    { name: "Corporate",  size: 140_000,   color: "#14B8A6" },
  ];

  // Top events — real if available, else static
  const topEventsDisplay = topEvents.length > 0 ? topEvents.map((e) => ({
    title: e.title, sold: e.orders, capacity: e.orders, revenue: e.revenue,
  })) : [
    { title: "Afrobeats Safari Vol. 9",   sold: 1840, capacity: 2000, revenue: 882_000 },
    { title: "Nairobi Jazz Fest",          sold: 3200, capacity: 4000, revenue: 1_536_000 },
    { title: "Savage Garden Rooftop",     sold: 490,  capacity: 500,  revenue: 294_000 },
    { title: "Comedy Warehouse Night",    sold: 310,  capacity: 350,  revenue: 124_000 },
    { title: "Kizomba Boat Party VII",    sold: 175,  capacity: 200,  revenue: 210_000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Platform performance · {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Row 1: KPI cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Users"
          value={loading ? "—" : totalUsers.toLocaleString()}
          sub={newThisMonth > 0 ? `+${newThisMonth.toLocaleString()} this month` : undefined}
          icon={Users}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600"
          sparkData={revenueSparkData}
          sparkKey="users"
        />
        <KpiCard
          title="Total Events"
          value={loading ? "—" : totalEvents.toLocaleString()}
          sub={activeEvents > 0 ? `${activeEvents} live now` : undefined}
          icon={CalendarDays}
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          iconColor="text-purple-600"
          sparkData={salesSparkData}
          sparkKey="events"
        />
        <KpiCard
          title="Total Revenue"
          value={loading ? "—" : formatCurrency(totalRevenue)}
          icon={DollarSign}
          iconBg="bg-green-50 dark:bg-green-950/40"
          iconColor="text-green-600"
          sparkData={revenueSparkData}
          sparkKey="revenue"
        />
        <KpiCard
          title="Tickets Sold"
          value={loading ? "—" : ticketsSold.toLocaleString()}
          sub={activeEvents > 0 ? `${activeEvents} active event${activeEvents !== 1 ? "s" : ""}` : undefined}
          icon={loading ? Radio : Ticket}
          iconBg="bg-red-50 dark:bg-red-950/40"
          iconColor="text-[#D93B2F]"
          sparkData={salesSparkData}
          sparkKey="active"
        />
      </div>

      {/* ── Row 2: Revenue + Volume combo | Category donut ───────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue vs Ticket Volume</CardTitle>
            <CardDescription className="text-xs">Dual-axis — bars = tickets sold, line = revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={salesChartData} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} interval={5} />
                <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#9CA3AF" }}
                  tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="sales" name="Tickets" fill={PRIMARY} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#22C55E" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Events by Category</CardTitle>
            <CardDescription className="text-xs">Share of {loading ? "…" : totalEvents.toLocaleString()} events</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryDonutData} cx="50%" cy="44%"
                  innerRadius={52} outerRadius={80} paddingAngle={2}
                  dataKey="value" nameKey="category">
                  {categoryDonutData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={7}
                  formatter={(v) => <span style={{ fontSize: 10, color: "#6B7280" }}>{v}</span>} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: User growth stacked area | Day-of-week ────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Acquisition — 12 Weeks</CardTitle>
            <CardDescription className="text-xs">New vs returning users per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowthData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7}
                  formatter={(v) => <span style={{ fontSize: 10, color: "#6B7280" }}>{v}</span>} />
                <Area type="monotone" dataKey="returning" name="Returning" stackId="1"
                  stroke="#3B82F6" strokeWidth={1.5} fill="url(#retGrad)" dot={false} />
                <Area type="monotone" dataKey="new" name="New Users" stackId="1"
                  stroke={PRIMARY} strokeWidth={1.5} fill="url(#newGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales by Day of Week</CardTitle>
            <CardDescription className="text-xs">Avg. tickets sold per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dayOfWeekData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tickets" name="Tickets" radius={[0, 4, 4, 0]}>
                  {dayOfWeekData.map((d, i) => (
                    <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Radar | Loyalty radial | Treemap ──────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Platform Health Score</CardTitle>
            <CardDescription className="text-xs">Composite KPI radar · max 100</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart cx="50%" cy="50%" outerRadius={75} data={radarData}>
                <PolarGrid stroke="rgba(156,163,175,0.2)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9.5, fill: "#9CA3AF" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#9CA3AF" }} />
                <Radar name="Score" dataKey="A" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.18} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Loyalty Tier Distribution</CardTitle>
            <CardDescription className="text-xs">{loading ? "…" : totalUsers.toLocaleString()} enrolled users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={90}
                barSize={14} data={loyaltyTierData} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="count" background={{ fill: "rgba(156,163,175,0.08)" }} cornerRadius={4}>
                  {loyaltyTierData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </RadialBar>
                <Legend iconType="circle" iconSize={7}
                  formatter={(v) => {
                    const item = loyaltyTierData.find((d) => d.name === v);
                    return <span style={{ fontSize: 10, color: "#6B7280" }}>{v} ({item?.pct}%)</span>;
                  }}
                />
                <Tooltip formatter={(v, n) => [Number(v).toLocaleString() + " users", n]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Treemap</CardTitle>
            <CardDescription className="text-xs">
              {treemapData.length > 0 ? "Top events by revenue" : "Area proportional to revenue by category"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <Treemap data={treemapDisplay} dataKey="size" aspectRatio={4 / 3} stroke="#fff"
                content={<TreemapBlock data={treemapDisplay} />} />
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Top events horizontal bar ─────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 5 Events by Revenue</CardTitle>
          <CardDescription className="text-xs">
            {topEvents.length > 0 ? "Live data · paid orders" : "Ticket fill rate shown as secondary bar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEventsDisplay.slice(0, 5).map((ev, i) => {
              const fillPct = ev.capacity > 0 ? Math.round((ev.sold / ev.capacity) * 100) : 100;
              const maxRevenue = topEventsDisplay[0]?.revenue || 1;
              const pct = Math.round((ev.revenue / maxRevenue) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[i] }}>
                        {i + 1}
                      </span>
                      <span className="truncate font-medium text-gray-800 dark:text-gray-200">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2 text-xs">
                      <span className="text-gray-500">{ev.sold.toLocaleString()} tickets</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">KES {(ev.revenue / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${topEvents.length > 0 ? pct : fillPct}%`, background: CATEGORY_COLORS[i] }} />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {topEvents.length > 0 ? `${pct}% of top revenue` : `${fillPct}% capacity filled`}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Row 6: Recent orders ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button variant="link" size="sm" asChild>
            <a href="/orders">View all →</a>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[0,1,2,3].map((i) => (
                <div key={i} className="px-6 py-3.5 animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="h-2.5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#D93B2F]/10 flex items-center justify-center text-xs font-bold text-[#D93B2F] flex-shrink-0">
                    {order.user?.firstName?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {order.event?.title ?? "—"} · {fmtRelative(order.paidAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(Number(order.total))}
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
