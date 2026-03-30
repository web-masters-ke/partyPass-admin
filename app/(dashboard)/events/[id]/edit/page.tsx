"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2, ImageIcon, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { eventsApi, mediaApi, unwrap } from "@/lib/api";
import type { Event, EventCategory } from "@/lib/types";
import toast from "react-hot-toast";

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "CLUB_NIGHT",  label: "Club Night" },
  { value: "FESTIVAL",    label: "Festival" },
  { value: "CONCERT",     label: "Concert" },
  { value: "COMEDY",      label: "Comedy" },
  { value: "SPORTS",      label: "Sports" },
  { value: "CORPORATE",   label: "Corporate" },
  { value: "PRIVATE",     label: "Private" },
  { value: "POP_UP",      label: "Pop-Up" },
  { value: "BOAT_PARTY",  label: "Boat Party" },
  { value: "ROOFTOP",     label: "Rooftop" },
];

const editSchema = z.object({
  title:          z.string().min(3, "Title required"),
  description:    z.string().min(10, "Description required"),
  category:       z.string().min(1, "Category required"),
  startDateTime:  z.string().min(1, "Start date required"),
  endDateTime:    z.string().min(1, "End date required"),
  doorsOpenAt:    z.string().optional(),
  maxCapacity:    z.coerce.number().int().min(1, "Capacity must be ≥ 1"),
  ageRestriction: z.coerce.number().int().min(0).optional(),
  dressCode:      z.string().optional(),
  refundPolicy:   z.string().optional(),
  isPrivate:      z.boolean().default(false),
  isOnline:       z.boolean().default(false),
});

type EditFormData = z.infer<typeof editSchema>;

function toInputDate(iso?: string) {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ""; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverChanged, setCoverChanged] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const isPrivate = watch("isPrivate");
  const isOnline  = watch("isOnline");

  useEffect(() => {
    eventsApi.get(id).then((res) => {
      const e = unwrap<Event>(res);
      setEvent(e);
      setCoverPreview(e.coverImageUrl ?? null);
      reset({
        title:          e.title,
        description:    e.description,
        category:       e.category,
        startDateTime:  toInputDate(e.startDateTime),
        endDateTime:    toInputDate(e.endDateTime),
        doorsOpenAt:    toInputDate(e.doorsOpenAt),
        maxCapacity:    e.maxCapacity,
        ageRestriction: e.ageRestriction ?? 0,
        dressCode:      e.dressCode ?? "",
        refundPolicy:   e.refundPolicy ?? "",
        isPrivate:      e.isPrivate,
        isOnline:       e.isOnline,
      });
    }).catch(() => {
      toast.error("Could not load event");
    }).finally(() => setLoading(false));
  }, [id, reset]);

  async function handleCoverUpload(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    setUploadingCover(true);
    try {
      const res = await mediaApi.upload(file);
      const { url } = unwrap<{ url: string }>(res);
      setCoverPreview(url);
      setCoverChanged(true);
      toast.success("Cover uploaded — save to apply");
    } catch {
      toast.error("Upload failed — try again");
    } finally {
      setUploadingCover(false);
    }
  }

  const onSubmit = async (data: EditFormData) => {
    try {
      await eventsApi.update(id, {
        ...data,
        startDateTime:  new Date(data.startDateTime).toISOString(),
        endDateTime:    new Date(data.endDateTime).toISOString(),
        doorsOpenAt:    data.doorsOpenAt ? new Date(data.doorsOpenAt).toISOString() : undefined,
        coverImageUrl:  coverPreview ?? undefined,
      });
      toast.success("Event saved!");
      router.push(`/events/${id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save — check fields");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Event not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/events">Back to Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* ── Sticky header ── */}
      <div className="sticky top-16 z-20 -mx-6 mb-6 flex items-center justify-between
        bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200
        dark:border-gray-700 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/events/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg
              bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Editing event</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{event.title}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
          className="flex items-center gap-2 rounded-xl bg-[#D93B2F] px-5 py-2.5 text-sm font-bold
            text-white shadow-lg shadow-[#D93B2F]/30 hover:bg-[#c0342a] active:scale-[0.97]
            disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Cover image ── */}
        <Section title="Cover Image">
          <div className="flex gap-5 items-start">
            {/* Preview box */}
            <div
              className="relative group flex-shrink-0 h-40 w-64 rounded-xl overflow-hidden
                bg-gray-100 dark:bg-gray-700 cursor-pointer border-2 border-dashed
                border-gray-300 dark:border-gray-600 hover:border-[#D93B2F] transition-colors"
              onClick={() => !uploadingCover && coverRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageIcon className="h-10 w-10" />
                  <span className="text-xs font-medium">No cover image</span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                flex flex-col items-center justify-center gap-2 transition-opacity">
                {uploadingCover
                  ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                  : <>
                      <Camera className="h-7 w-7 text-white" />
                      <span className="text-xs font-bold text-white">
                        {coverPreview ? "Change photo" : "Add photo"}
                      </span>
                    </>}
              </div>
              {/* Changed badge */}
              {coverChanged && (
                <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  ✓ New
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="pt-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Event cover photo</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Shown on event listings, tickets, and social shares
                </p>
              </div>
              <ul className="text-xs text-gray-400 space-y-0.5">
                <li>• Recommended: 1200 × 630 px</li>
                <li>• JPG, PNG or WEBP</li>
                <li>• Max 10 MB</li>
              </ul>
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-700
                  dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
                  disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingCover ? "Uploading…" : coverPreview ? "Replace photo" : "Upload photo"}
              </button>
            </div>
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
              e.target.value = "";
            }}
          />
        </Section>

        {/* ── Basic info ── */}
        <Section title="Basic Info">
          <div className="space-y-4">
            <Field label="Event Title *" error={errors.title?.message}>
              <Input
                placeholder="e.g. Afro Fridays Vol. 13"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                {...register("title")}
              />
            </Field>

            <Field label="Description *" error={errors.description?.message}>
              <Textarea
                rows={4}
                placeholder="Describe the vibe, lineup, what to expect…"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
                {...register("description")}
              />
            </Field>

            <Field label="Category *">
              <Select
                defaultValue={event.category}
                onValueChange={(v) => setValue("category", v)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* ── Schedule ── */}
        <Section title="Schedule">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date & Time *" error={errors.startDateTime?.message}>
                <Input
                  type="datetime-local"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register("startDateTime")}
                />
              </Field>
              <Field label="End Date & Time *" error={errors.endDateTime?.message}>
                <Input
                  type="datetime-local"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register("endDateTime")}
                />
              </Field>
            </div>
            <Field label="Doors Open At">
              <Input
                type="datetime-local"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                {...register("doorsOpenAt")}
              />
            </Field>
          </div>
        </Section>

        {/* ── Capacity & Access ── */}
        <Section title="Capacity & Access">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Max Capacity *" error={errors.maxCapacity?.message}>
                <Input
                  type="number"
                  min={1}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register("maxCapacity")}
                />
              </Field>
              <Field label="Age Restriction">
                <Input
                  type="number"
                  min={0}
                  placeholder="0 = none"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register("ageRestriction")}
                />
              </Field>
              <Field label="Dress Code">
                <Input
                  placeholder="e.g. Smart casual"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  {...register("dressCode")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Private Event</p>
                  <p className="text-xs text-gray-400 mt-0.5">Invite-only, hidden from public</p>
                </div>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={(v) => setValue("isPrivate", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Online Event</p>
                  <p className="text-xs text-gray-400 mt-0.5">Streamed / virtual attendance</p>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={(v) => setValue("isOnline", v)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Policies ── */}
        <Section title="Policies">
          <Field label="Refund Policy">
            <Textarea
              rows={3}
              placeholder="e.g. No refunds within 48 hours of the event."
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 resize-none"
              {...register("refundPolicy")}
            />
          </Field>
        </Section>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href={`/events/${id}`}
            className="rounded-xl border border-gray-200 dark:border-gray-600 px-5 py-2.5
              text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50
              dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#D93B2F] px-6 py-2.5 text-sm font-bold
              text-white shadow-lg shadow-[#D93B2F]/30 hover:bg-[#c0342a] active:scale-[0.97]
              disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
