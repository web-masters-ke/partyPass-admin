"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Tag, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import api, { eventsApi, unwrap } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  uses: number;
  maxUses: number;
  expiresAt?: string;
  isActive: boolean;
  eventId?: string;
  eventTitle?: string;
}

interface Event {
  id: string;
  title: string;
}

const promoSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 chars").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(1, "Value required"),
  maxUses: z.coerce.number().int().min(1, "Max uses required"),
  expiresAt: z.string().optional(),
  eventId: z.string().optional(),
});

type PromoFormData = z.infer<typeof promoSchema>;

const mockCodes: PromoCode[] = [
  {
    id: "pr1",
    code: "EARLYBIRD20",
    type: "PERCENTAGE",
    value: 20,
    uses: 45,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    isActive: true,
    eventTitle: "Nairobi Jazz Festival",
  },
  {
    id: "pr2",
    code: "VIPFRIENDS",
    type: "PERCENTAGE",
    value: 15,
    uses: 12,
    maxUses: 50,
    isActive: true,
    eventTitle: "Afro Fridays Vol. 12",
  },
  {
    id: "pr3",
    code: "FLAT500",
    type: "FIXED",
    value: 500,
    uses: 28,
    maxUses: 30,
    expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    isActive: false,
  },
];

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const form = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: { type: "PERCENTAGE", maxUses: 100 },
  });

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/promo-codes");
      const data = unwrap<{ items: PromoCode[] }>(res);
      setCodes(data.items ?? []);
    } catch {
      setCodes(mockCodes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
    // Load events for selector
    eventsApi
      .list({ limit: 50 })
      .then((res) => {
        const data = unwrap<{ items: Event[] }>(res);
        setEvents(data.items ?? []);
      })
      .catch(() => {});
  }, [loadCodes]);

  const handleSubmit = async (data: PromoFormData) => {
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/admin/promo-codes", data);
      setModalOpen(false);
      form.reset();
      loadCodes();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || "Failed to create promo code.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    // Optimistic update
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
    );
    try {
      await api.patch(`/admin/promo-codes/${id}/toggle`);
      loadCodes();
    } catch {
      // revert on failure
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: current } : c))
      );
    }
  };

  const deleteCode = async (id: string) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      loadCodes();
    } catch {
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Promo Codes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage discount codes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCodes} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-[#D93B2F] hover:bg-[#c0392b] text-white"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Code
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse border-b border-gray-100 dark:border-gray-700 last:border-0"
                />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tag className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No promo codes yet</p>
              <Button
                size="sm"
                className="mt-3 bg-[#D93B2F] hover:bg-[#c0392b] text-white"
                onClick={() => setModalOpen(true)}
              >
                Create your first code
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {["Code", "Type", "Event", "Usage", "Expires", "Active", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const usePct = Math.round((code.uses / code.maxUses) * 100);
                    return (
                      <tr
                        key={code.id}
                        className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">
                            {code.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                            {code.type === "PERCENTAGE"
                              ? `${code.value}% off`
                              : `KES ${code.value} off`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[120px]">
                          <span className="truncate block">{code.eventTitle ?? "All events"}</span>
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>{code.uses}</span>
                              <span>{code.maxUses}</span>
                            </div>
                            <Progress value={usePct} className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {code.expiresAt ? formatDate(code.expiresAt) : "No expiry"}
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={code.isActive}
                            onCheckedChange={() => toggleActive(code.id, code.isActive)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCode(code.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Promo Code Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Create Promo Code
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Code</Label>
              <Input
                {...form.register("code")}
                placeholder="EARLYBIRD20"
                className="font-mono uppercase dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                onChange={(e) =>
                  form.setValue("code", e.target.value.toUpperCase())
                }
              />
              {form.formState.errors.code && (
                <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Type</Label>
                <Select
                  defaultValue="PERCENTAGE"
                  onValueChange={(v) =>
                    form.setValue("type", v as "PERCENTAGE" | "FIXED")
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="PERCENTAGE" className="dark:text-gray-100">% Percentage</SelectItem>
                    <SelectItem value="FIXED" className="dark:text-gray-100">KES Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">
                  Value ({form.watch("type") === "PERCENTAGE" ? "%" : "KES"})
                </Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("value")}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                {form.formState.errors.value && (
                  <p className="text-xs text-red-500">{form.formState.errors.value.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Max Uses</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register("maxUses")}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-700 dark:text-gray-300">Expires At</Label>
                <Input
                  type="date"
                  {...form.register("expiresAt")}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Event (optional)</Label>
              <Select onValueChange={(v) => form.setValue("eventId", v === "__all__" ? undefined : v)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="__all__" className="dark:text-gray-100">All events</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="dark:text-gray-100">
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#D93B2F] hover:bg-[#c0392b] text-white"
              >
                {submitting ? "Creating..." : "Create Code"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
