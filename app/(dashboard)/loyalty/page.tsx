"use client";

import { useEffect, useState } from "react";
import { Award, Star, TrendingUp, Gift } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loyaltyApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";

interface LoyaltyOverview {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeRewards: number;
  tierBreakdown: Array<{ tier: string; count: number; percentage: number }>;
  topUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    loyaltyTier: string;
    loyaltyPoints: number;
  }>;
  recentRedemptions: Array<{
    id: string;
    userId: string;
    rewardName: string;
    pointsCost: number;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }>;
}

const EMPTY_DATA: LoyaltyOverview = {
  totalPointsIssued: 0,
  totalPointsRedeemed: 0,
  activeRewards: 0,
  tierBreakdown: [],
  topUsers: [],
  recentRedemptions: [],
};

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#D97706",
  SILVER: "#9CA3AF",
  GOLD: "#F59E0B",
  PLATINUM: "#0EA5E9",
  DIAMOND: "#8B5CF6",
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await loyaltyApi.overview();
        const raw = unwrap<Partial<LoyaltyOverview>>(res);
        setData({ ...EMPTY_DATA, ...raw });
      } catch {
        toast.error("Failed to load loyalty data");
        setData(EMPTY_DATA);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  const d = data ?? EMPTY_DATA;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loyalty Program</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tier breakdown, points, and rewards</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Points Issued"
          value={(d.totalPointsIssued ?? 0).toLocaleString()}
          icon={Star}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Points Redeemed"
          value={(d.totalPointsRedeemed ?? 0).toLocaleString()}
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Active Rewards"
          value={d.activeRewards}
          icon={Gift}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tier breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {d.tierBreakdown.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-gray-400">
                No tier data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={d.tierBreakdown}
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    dataKey="count"
                    nameKey="tier"
                    label={({ tier, percentage }) => `${tier} ${percentage}%`}
                    labelLine={false}
                  >
                    {d.tierBreakdown.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}
                    formatter={(v: number) => [v.toLocaleString(), "Users"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tier bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users per Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {d.tierBreakdown.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-gray-400">
                No tier data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={d.tierBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="tier" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}
                    formatter={(v: number) => [v.toLocaleString(), "Users"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {d.tierBreakdown.map((entry) => (
                      <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || "#9CA3AF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top users leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Users by Points</CardTitle>
          </CardHeader>
          <CardContent>
            {d.topUsers.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No user data yet</div>
            ) : (
              <div className="space-y-3">
                {d.topUsers.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 text-center text-sm font-bold text-gray-400 dark:text-gray-500">
                      {idx + 1}
                    </span>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: TIER_COLORS[user.loyaltyTier] || "#9CA3AF" }}
                    >
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.firstName} {user.lastName}
                      </p>
                      <Badge
                        variant={user.loyaltyTier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum" | "diamond"}
                        className="text-xs"
                      >
                        {user.loyaltyTier}
                      </Badge>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {(user.loyaltyPoints ?? 0).toLocaleString()} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent redemptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            {d.recentRedemptions.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No redemptions yet</div>
            ) : (
              <div className="space-y-3">
                {d.recentRedemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.rewardName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.user?.firstName} {r.user?.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#D93B2F]">
                        -{(r.pointsCost ?? 0).toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
