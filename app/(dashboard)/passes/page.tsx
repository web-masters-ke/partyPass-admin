"use client";

import { useEffect, useState, useCallback } from "react";
import { QrCode, Plus, RefreshCw, Search, Ticket, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { IssuePassModal } from "@/components/issue-pass-modal";
import api, { unwrap } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Pass {
  id: string;
  type: string;
  holderName: string;
  holderEmail: string;
  organization?: string;
  issuedAt: string;
  status: "ACTIVE" | "REVOKED" | "USED" | "EXPIRED";
  eventId?: string;
  eventTitle?: string;
  qrCode?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  REVOKED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  USED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  EXPIRED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

const TYPE_COLORS: Record<string, string> = {
  MEDIA: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  VIP_GUEST: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  ARTIST: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  SPONSOR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  STAFF: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  COMP: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const mockPasses: Pass[] = [
  {
    id: "p1",
    type: "MEDIA",
    holderName: "John Kamau",
    holderEmail: "john@nationmedia.co.ke",
    organization: "Nation Media Group",
    issuedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "ACTIVE",
    eventTitle: "Nairobi Jazz Festival",
    qrCode: "PASS-JK-001",
  },
  {
    id: "p2",
    type: "VIP_GUEST",
    holderName: "Grace Wanjiku",
    holderEmail: "grace@example.com",
    issuedAt: new Date(Date.now() - 172800000).toISOString(),
    status: "ACTIVE",
    eventTitle: "Afro Fridays Vol. 12",
    qrCode: "PASS-GW-002",
  },
  {
    id: "p3",
    type: "ARTIST",
    holderName: "DJ Kalonje",
    holderEmail: "djkalonje@gmail.com",
    issuedAt: new Date(Date.now() - 259200000).toISOString(),
    status: "USED",
    eventTitle: "Afro Fridays Vol. 11",
    qrCode: "PASS-DK-003",
  },
];

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState<Pass | null>(null);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/passes", { params: { search, status: statusFilter !== "ALL" ? statusFilter : undefined } });
      const data = unwrap<{ items: Pass[] }>(res);
      setPasses(data.items ?? []);
    } catch {
      setPasses(mockPasses);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  const revokePass = async (passId: string) => {
    try {
      await api.post(`/admin/passes/${passId}/revoke`);
      loadPasses();
    } catch {
      // fail silently in mock mode
      setPasses((prev) =>
        prev.map((p) => (p.id === passId ? { ...p, status: "REVOKED" } : p))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Passes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage complimentary and special access passes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPasses} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-[#D93B2F] hover:bg-[#c0392b] text-white"
            onClick={() => setIssueModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Issue Pass
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            {["ALL", "ACTIVE", "REVOKED", "USED", "EXPIRED"].map((s) => (
              <SelectItem key={s} value={s} className="dark:text-gray-100 dark:focus:bg-gray-700">
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse border-b border-gray-100 dark:border-gray-700 last:border-0" />
              ))}
            </div>
          ) : passes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ticket className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No passes found</p>
              <Button
                size="sm"
                className="mt-3 bg-[#D93B2F] hover:bg-[#c0392b] text-white"
                onClick={() => setIssueModalOpen(true)}
              >
                Issue your first pass
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Holder
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Issued
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((pass) => (
                    <tr
                      key={pass.id}
                      className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {pass.holderName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {pass.holderEmail}
                        </p>
                        {pass.organization && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {pass.organization}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            TYPE_COLORS[pass.type] ?? "bg-gray-100 text-gray-700"
                          )}
                        >
                          {pass.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[140px]">
                        <span className="truncate block">{pass.eventTitle ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {formatDate(pass.issuedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            STATUS_COLORS[pass.status]
                          )}
                        >
                          {pass.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Show QR Code"
                            onClick={() => setQrModal(pass)}
                          >
                            <QrCode className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                          {pass.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Revoke Pass"
                              onClick={() => revokePass(pass.id)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Pass Modal */}
      <IssuePassModal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onSuccess={loadPasses}
      />

      {/* QR Code Modal */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              QR Code — {qrModal?.holderName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Placeholder QR representation */}
            <div className="h-48 w-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <QrCode className="h-32 w-32 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {qrModal?.qrCode ?? "N/A"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {qrModal?.type?.replace("_", " ")} &bull; {qrModal?.eventTitle}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
