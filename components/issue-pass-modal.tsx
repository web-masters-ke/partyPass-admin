"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import api, { eventsApi, unwrap } from "@/lib/api";

interface IssuePassModalProps {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  onSuccess?: () => void;
}

interface Event {
  id: string;
  title: string;
}

const PASS_TYPES = [
  { value: "MEDIA", label: "Media Pass" },
  { value: "VIP_GUEST", label: "VIP Guest Pass" },
  { value: "ARTIST", label: "Artist / Performer Pass" },
  { value: "SPONSOR", label: "Sponsor Pass" },
  { value: "STAFF", label: "Staff Pass" },
  { value: "COMP", label: "Complimentary Pass" },
];

const EMPTY_FORM = {
  type: "",
  name: "",
  email: "",
  organization: "",
  notes: "",
  validFrom: "",
  validUntil: "",
  selectedEventId: "",
};

export function IssuePassModal({ open, onClose, eventId, onSuccess }: IssuePassModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load events for selector (when no eventId is pre-provided)
  useEffect(() => {
    if (open && !eventId) {
      eventsApi.list({ limit: 50 }).then((res) => {
        const data = unwrap<{ items: Event[] }>(res);
        setEvents(data.items ?? []);
      }).catch(() => {});
    }
  }, [open, eventId]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, selectedEventId: eventId ?? "" });
      setError("");
      setSuccess(false);
    }
  }, [open, eventId]);

  const f = (k: keyof typeof form, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const targetEventId = eventId ?? form.selectedEventId;
    if (!form.type) { setError("Pass type is required."); return; }
    if (!form.name.trim()) { setError("Holder name is required."); return; }
    if (!form.email.trim()) { setError("Holder email is required."); return; }
    if (!targetEventId) { setError("Please select an event."); return; }

    setError("");
    setLoading(true);
    try {
      await api.post(`/events/${targetEventId}/passes`, {
        type: form.type,
        name: form.name.trim(),
        email: form.email.trim(),
        organization: form.organization.trim() || undefined,
        notes: form.notes.trim() || undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to issue pass. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Issue Pass</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Event selector (only when no pre-selected event) */}
          {!eventId && (
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Event *</Label>
              <Select value={form.selectedEventId} onValueChange={(v) => f("selectedEventId", v)}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-52">
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id} className="dark:text-gray-100">
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pass type */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">Pass Type *</Label>
            <Select value={form.type} onValueChange={(v) => f("type", v)}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                <SelectValue placeholder="Select pass type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                {PASS_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="dark:text-gray-100 dark:focus:bg-gray-700">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Holder info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Full Name *</Label>
              <Input
                placeholder="e.g. John Kamau"
                value={form.name}
                onChange={(e) => f("name", e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">Email *</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => f("email", e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">
              Organization <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Nation Media Group, Standard Group..."
              value={form.organization}
              onChange={(e) => f("organization", e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Validity dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">
                Valid From <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => f("validFrom", e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-700 dark:text-gray-300">
                Valid Until <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => f("validUntil", e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">
              Notes <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
            </Label>
            <Textarea
              placeholder="Any special access requirements, backstage areas, etc."
              value={form.notes}
              onChange={(e) => f("notes", e.target.value)}
              rows={2}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">Pass issued successfully!</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || success}
            className="bg-[#D93B2F] hover:bg-[#c0392b] text-white"
          >
            {loading ? "Issuing..." : success ? "Issued!" : "Issue Pass"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
