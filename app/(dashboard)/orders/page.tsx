"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingCart, RefreshCw, Search, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ordersApi, unwrap } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

interface Order {
  id: string;
  status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED" | "FAILED";
  total: number;
  quantity: number;
  paidAt?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  event?: { id: string; title: string };
  promoCode?: { code: string };
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  REFUNDED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    status: "PAID",
    total: 4500,
    quantity: 3,
    paidAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { id: "u1", firstName: "Grace", lastName: "Wanjiku", email: "grace@example.com" },
    event: { id: "e1", title: "Nairobi Jazz Festival" },
  },
  {
    id: "ORD-002",
    status: "PAID",
    total: 1500,
    quantity: 1,
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: { id: "u2", firstName: "John", lastName: "Kamau", email: "john@example.com" },
    event: { id: "e2", title: "Afro Fridays Vol. 12" },
    promoCode: { code: "EARLYBIRD20" },
  },
  {
    id: "ORD-003",
    status: "REFUNDED",
    total: 3000,
    quantity: 2,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    user: { id: "u3", firstName: "Mary", lastName: "Njoroge", email: "mary@example.com" },
    event: { id: "e1", title: "Nairobi Jazz Festival" },
  },
  {
    id: "ORD-004",
    status: "PENDING",
    total: 2000,
    quantity: 2,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { id: "u4", firstName: "Brian", lastName: "Omondi", email: "brian@example.com" },
    event: { id: "e3", title: "Klub Reloaded" },
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detail, setDetail] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      const data = unwrap<{ items: Order[]; total: number }>(res);
      setOrders(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setOrders(mockOrders);
      setTotal(mockOrders.length);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All ticket purchase orders — {total.toLocaleString()} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Paid", status: "PAID", color: "text-green-600" },
          { label: "Pending", status: "PENDING", color: "text-yellow-600" },
          { label: "Refunded", status: "REFUNDED", color: "text-blue-600" },
          { label: "Failed/Cancelled", status: "FAILED|CANCELLED", color: "text-red-500" },
        ].map(({ label, status, color }) => {
          const count = orders.filter((o) =>
            status.includes("|") ? status.split("|").includes(o.status) : o.status === status
          ).length;
          return (
            <Card key={label} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${color}`}>{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="Search by order ID or customer email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            {["ALL", "PAID", "PENDING", "REFUNDED", "CANCELLED", "FAILED"].map((s) => (
              <SelectItem key={s} value={s} className="dark:text-gray-100">
                {s === "ALL" ? "All Statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse border-b border-gray-100 dark:border-gray-700 last:border-0" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {["Order ID", "Customer", "Event", "Qty", "Total (KES)", "Promo", "Status", "Date", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                          {order.id.length > 12 ? order.id.slice(0, 12) + "…" : order.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                          {order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}
                        </p>
                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[140px]">
                        <span className="truncate block">{order.event?.title ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                        {order.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {order.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {order.promoCode ? (
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                            {order.promoCode.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[order.status])}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(order.paidAt ?? order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetail(order)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Order Details
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                  <p className="font-mono text-xs text-gray-800 dark:text-gray-200">{detail.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_COLORS[detail.status])}>
                    {detail.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {detail.user ? `${detail.user.firstName} ${detail.user.lastName}` : "—"}
                  </p>
                  <p className="text-xs text-gray-400">{detail.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Event</p>
                  <p className="text-gray-800 dark:text-gray-200">{detail.event?.title ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{detail.quantity} ticket{detail.quantity !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">KES {detail.total.toLocaleString()}</p>
                </div>
                {detail.promoCode && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Promo Code</p>
                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{detail.promoCode.code}</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-gray-600 dark:text-gray-400">{formatDate(detail.createdAt)}</p>
                </div>
                {detail.paidAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paid At</p>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(detail.paidAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
