"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Check, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eventsApi, mediaApi, unwrap } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Schemas ────────────────────────────────────────────────────────────────
const basicInfoSchema = z.object({
  title: z.string().min(3, "Title required (min 3 chars)"),
  description: z.string().min(10, "Description required"),
  category: z.string().min(1, "Category required"),
  startDateTime: z.string().min(1, "Start date required"),
  endDateTime: z.string().min(1, "End date required"),
  doorsOpenAt: z.string().optional(),
  venue: z.string().optional(),
  maxCapacity: z.coerce.number().int().min(1, "Capacity required"),
  ageRestriction: z.coerce.number().int().min(0).optional(),
  dressCode: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isOnline: z.boolean().default(false),
});

const tierSchema = z.object({
  name: z.string().min(1, "Tier name required"),
  price: z.coerce.number().min(0, "Price required"),
  totalQuantity: z.coerce.number().int().min(1, "Quantity required"),
  tierType: z.string().default("GA"),
  perks: z.string().optional(),
  allowReEntry: z.boolean().default(false),
});

const tiersSchema = z.object({
  tiers: z.array(tierSchema).min(1, "Add at least one tier"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
type TiersFormData = z.infer<typeof tiersSchema>;

const CATEGORIES = [
  "CLUB_NIGHT", "FESTIVAL", "CONCERT", "COMEDY", "SPORTS",
  "CORPORATE", "PRIVATE", "POP_UP", "BOAT_PARTY", "ROOFTOP",
];
const TIER_TYPES = [
  { value: "GA", label: "General Admission" },
  { value: "EARLY_BIRD", label: "Early Bird" },
  { value: "VIP", label: "VIP" },
  { value: "VVIP", label: "VVIP" },
  { value: "TABLE", label: "Table" },
  { value: "GROUP", label: "Group" },
  { value: "BACKSTAGE", label: "Backstage" },
  { value: "PRESS", label: "Press" },
  { value: "COMP", label: "Complimentary" },
];

const STEPS = ["Basic Info", "Ticket Tiers", "Media", "Review & Publish"];

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Step 1 — Basic info
  const [basicData, setBasicData] = useState<BasicInfoFormData | null>(null);
  const basicForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { isPrivate: false, isOnline: false, maxCapacity: 0, ageRestriction: 0 },
  });

  // Step 2 — Tiers
  const [tiersData, setTiersData] = useState<TiersFormData | null>(null);
  const tiersForm = useForm<TiersFormData>({
    resolver: zodResolver(tiersSchema),
    defaultValues: {
      tiers: [{ name: "General Admission", price: 500, totalQuantity: 100, tierType: "GA", perks: "", allowReEntry: false }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: tiersForm.control,
    name: "tiers",
  });

  // Step 3 — Media
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [promoVideoUrl, setPromoVideoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(file);
      const data = unwrap<{ url: string }>(res);
      setCoverImageUrl(data.url);
    } catch {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!basicData) return;
    setPublishing(true);
    setError(null);
    try {
      await createEvent(false);
      router.push("/events");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Failed to save draft.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async () => {
    if (!basicData) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await createEvent(false);
      const event = unwrap<{ id: string }>(res);
      await eventsApi.publish(event.id);
      router.push(`/events/${event.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Failed to publish event.");
    } finally {
      setPublishing(false);
    }
  };

  const createEvent = async (publish: boolean) => {
    const tiers = tiersData?.tiers ?? [];
    const payload = {
      ...basicData,
      coverImageUrl: coverImageUrl || undefined,
      promoVideoUrl: promoVideoUrl || undefined,
      ticketTiers: tiers.map((t) => ({
        ...t,
        perks: t.perks ? t.perks.split(",").map((p) => p.trim()) : [],
      })),
    };
    return eventsApi.create(payload as Record<string, unknown>);
  };

  // Step navigation
  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleStep1Submit = (data: BasicInfoFormData) => {
    setBasicData(data);
    goNext();
  };

  const handleStep2Submit = (data: TiersFormData) => {
    setTiersData(data);
    goNext();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create Event</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the details to create a new event</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => idx < step && setStep(idx)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                idx < step
                  ? "border-[#D93B2F] bg-[#D93B2F] text-white cursor-pointer"
                  : idx === step
                  ? "border-[#D93B2F] bg-white dark:bg-gray-800 text-[#D93B2F]"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500"
              )}
            >
              {idx < step ? <Check className="h-4 w-4" /> : idx + 1}
            </button>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                idx === step ? "text-[#D93B2F]" : idx < step ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  idx < step ? "bg-[#D93B2F]" : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Step 1: Basic Info ── */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={basicForm.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Event Title *</Label>
                <Input placeholder="Afro Fridays Vol. 12" {...basicForm.register("title")} />
                {basicForm.formState.errors.title && (
                  <p className="text-xs text-red-500">{basicForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea
                  rows={4}
                  placeholder="Describe the event..."
                  {...basicForm.register("description")}
                />
                {basicForm.formState.errors.description && (
                  <p className="text-xs text-red-500">{basicForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select
                    defaultValue=""
                    onValueChange={(v) => basicForm.setValue("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {basicForm.formState.errors.category && (
                    <p className="text-xs text-red-500">{basicForm.formState.errors.category.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Max Capacity *</Label>
                  <Input type="number" min={1} placeholder="500" {...basicForm.register("maxCapacity")} />
                  {basicForm.formState.errors.maxCapacity && (
                    <p className="text-xs text-red-500">{basicForm.formState.errors.maxCapacity.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date & Time *</Label>
                  <Input type="datetime-local" {...basicForm.register("startDateTime")} />
                  {basicForm.formState.errors.startDateTime && (
                    <p className="text-xs text-red-500">{basicForm.formState.errors.startDateTime.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>End Date & Time *</Label>
                  <Input type="datetime-local" {...basicForm.register("endDateTime")} />
                  {basicForm.formState.errors.endDateTime && (
                    <p className="text-xs text-red-500">{basicForm.formState.errors.endDateTime.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Doors Open At</Label>
                  <Input type="datetime-local" {...basicForm.register("doorsOpenAt")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Venue</Label>
                  <Input placeholder="Venue name or address" {...basicForm.register("venue")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Age Restriction (0 = none)</Label>
                  <Input type="number" min={0} placeholder="18" {...basicForm.register("ageRestriction")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dress Code</Label>
                  <Input placeholder="Smart casual" {...basicForm.register("dressCode")} />
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPrivate"
                    onCheckedChange={(v) => basicForm.setValue("isPrivate", v)}
                  />
                  <Label htmlFor="isPrivate">Private Event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isOnline"
                    onCheckedChange={(v) => basicForm.setValue("isOnline", v)}
                  />
                  <Label htmlFor="isOnline">Online Event</Label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit">Continue to Ticket Tiers</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Ticket Tiers ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={tiersForm.handleSubmit(handleStep2Submit)} className="space-y-4">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tier {idx + 1}</h3>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tier Name *</Label>
                      <Input
                        placeholder="General Admission"
                        {...tiersForm.register(`tiers.${idx}.name`)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tier Type</Label>
                      <Select
                        defaultValue="GA"
                        onValueChange={(v) => tiersForm.setValue(`tiers.${idx}.tierType`, v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIER_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Price (KES) *</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="1000"
                        {...tiersForm.register(`tiers.${idx}.price`)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        {...tiersForm.register(`tiers.${idx}.totalQuantity`)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Perks (comma-separated)</Label>
                    <Input
                      placeholder="Free drink, VIP lounge access"
                      {...tiersForm.register(`tiers.${idx}.perks`)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`allowReEntry-${idx}`}
                      onCheckedChange={(v) => tiersForm.setValue(`tiers.${idx}.allowReEntry`, v)}
                    />
                    <Label htmlFor={`allowReEntry-${idx}`}>Allow Re-entry</Label>
                  </div>
                </div>
              ))}

              {tiersForm.formState.errors.tiers && (
                <p className="text-xs text-red-500">
                  {tiersForm.formState.errors.tiers.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({ name: "", price: 0, totalQuantity: 50, tierType: "GA", perks: "", allowReEntry: false })
                }
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Tier
              </Button>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button type="submit">Continue to Media</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Media ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                {coverImageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={coverImageUrl}
                      alt="Cover"
                      className="mx-auto h-40 rounded-lg object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverImageUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {uploading ? "Uploading..." : "Click to upload cover image"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleCoverUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Promo Video URL</Label>
              <Input
                type="url"
                placeholder="https://youtube.com/..."
                value={promoVideoUrl}
                onChange={(e) => setPromoVideoUrl(e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button onClick={goNext}>Continue to Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Review & Publish ── */}
      {step === 3 && basicData && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Title</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{basicData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Category</span>
                <span className="font-medium dark:text-gray-200">{basicData.category?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Max Capacity</span>
                <span className="font-medium dark:text-gray-200">{basicData.maxCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tiers</span>
                <span className="font-medium dark:text-gray-200">{tiersData?.tiers.length ?? 0} tiers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cover Image</span>
                <span className="font-medium dark:text-gray-200">{coverImageUrl ? "Uploaded" : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Private</span>
                <span className="font-medium dark:text-gray-200">{basicData.isPrivate ? "Yes" : "No"}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={publishing}
                >
                  Save Draft
                </Button>
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing ? "Publishing..." : "Publish Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
