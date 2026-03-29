"use client";

import { useState } from "react";
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
import { notificationsApi, unwrap } from "@/lib/api";

interface AnnounceModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
}

export function AnnounceModal({ open, onClose, eventId, eventTitle }: AnnounceModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await notificationsApi.broadcast({
        title,
        message,
        targetType: "EVENT",
        eventId,
        channels: ["PUSH", "EMAIL"],
      });
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setTitle("");
        setMessage("");
        onClose();
      }, 1500);
    } catch {
      setError("Failed to send announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Send Announcement
          </DialogTitle>
          {eventTitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To attendees of: <strong>{eventTitle}</strong>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">Title</Label>
            <Input
              placeholder="e.g. Doors open early tonight!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 dark:text-gray-300">Message</Label>
            <Textarea
              placeholder="Write your announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {sent && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Announcement sent successfully!
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || sent}
            className="bg-[#D93B2F] hover:bg-[#c0392b] text-white"
          >
            {loading ? "Sending..." : sent ? "Sent!" : "Send Announcement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
