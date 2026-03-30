"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notificationsApi, unwrap } from "@/lib/api";

const broadcastSchema = z.object({
  title: z.string().min(3, "Title required"),
  body: z.string().min(10, "Message body required"),
  targetAudience: z.string().min(1, "Select a target"),
  sendPush: z.boolean().default(true),
  sendEmail: z.boolean().default(false),
  sendSms: z.boolean().default(false),
  eventId: z.string().optional(),
});

type BroadcastFormData = z.infer<typeof broadcastSchema>;

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All Users" },
  { value: "ATTENDEE", label: "Attendees Only" },
  { value: "ORGANIZER", label: "Organizers Only" },
  { value: "RECENT_BUYERS", label: "Recent Ticket Buyers (7 days)" },
  { value: "TIER_GOLD_PLUS", label: "Gold Tier & Above" },
  { value: "EVENT_ATTENDEES", label: "Specific Event Attendees" },
];

interface SentNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  sentAt: string;
  delivered: number;
  opened: number;
}

const recentNotifications: SentNotification[] = [
  {
    id: "n1",
    title: "Weekend Lineup Announced!",
    body: "We've just announced the full lineup for Afro Fridays Vol. 12...",
    audience: "ALL",
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    delivered: 12847,
    opened: 4230,
  },
  {
    id: "n2",
    title: "VIP Tickets Selling Fast!",
    body: "Only 20 VIP tickets left for Nairobi Jazz Festival...",
    audience: "ATTENDEE",
    sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    delivered: 8930,
    opened: 2140,
  },
  {
    id: "n3",
    title: "Payout Processed",
    body: "Your event revenue payout has been processed...",
    audience: "ORGANIZER",
    sentAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    delivered: 234,
    opened: 189,
  },
];

export default function NotificationsPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SentNotification[]>(recentNotifications);

  const {
    register,
    handleSubmit,
    watch: formWatch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { sendPush: true, sendEmail: false, sendSms: false, targetAudience: "" },
  });

  useEffect(() => {
    notificationsApi.list({ limit: 20 }).then((res) => {
      const data = unwrap<{ items: SentNotification[] }>(res);
      if (data.items?.length) setHistory(data.items);
    }).catch(() => {});
  }, []);

  const targetAudience = formWatch("targetAudience");

  const onSubmit = async (data: BroadcastFormData) => {
    setError(null);
    setSuccess(false);
    try {
      await notificationsApi.broadcast(data as unknown as Record<string, unknown>);
      setSuccess(true);
      reset();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Failed to send notification.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Broadcast notifications to users</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-[#D93B2F]" />
              Send Broadcast Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {success && (
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Notification sent successfully!</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Target Audience *</Label>
                <Select
                  onValueChange={(v) => setValue("targetAudience", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.targetAudience && (
                  <p className="text-xs text-red-500">{errors.targetAudience.message}</p>
                )}
              </div>

              {targetAudience === "EVENT_ATTENDEES" && (
                <div className="space-y-1.5">
                  <Label>Event ID</Label>
                  <Input placeholder="Enter event ID" {...register("eventId")} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Notification Title *</Label>
                <Input placeholder="e.g. Weekend Lineup Announced!" {...register("title")} />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Message Body *</Label>
                <Textarea
                  rows={4}
                  placeholder="Write your notification message..."
                  {...register("body")}
                />
                {errors.body && (
                  <p className="text-xs text-red-500">{errors.body.message}</p>
                )}
              </div>

              {/* Channels */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Delivery Channels</p>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="cursor-pointer">Push Notification</Label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Send to mobile app</p>
                  </div>
                  <Switch
                    defaultChecked
                    onCheckedChange={(v) => setValue("sendPush", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="cursor-pointer">Email</Label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Send via Brevo</p>
                  </div>
                  <Switch onCheckedChange={(v) => setValue("sendEmail", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="cursor-pointer">SMS</Label>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Send via Bonga SMS</p>
                  </div>
                  <Switch onCheckedChange={(v) => setValue("sendSms", v)} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {n.audience}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>
                      {new Date(n.sentAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{n.delivered.toLocaleString()}</span> delivered
                    </span>
                    <span className="text-green-600">
                      <span className="font-medium">{n.opened.toLocaleString()}</span> opened (
                      {Math.round((n.opened / n.delivered) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
