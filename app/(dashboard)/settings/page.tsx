"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, CheckCircle, AlertCircle, Globe, Shield, DollarSign, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsApi, unwrap } from "@/lib/api";

const settingsSchema = z.object({
  platformName: z.string().min(2, "Required"),
  platformFeePercent: z.coerce.number().min(0).max(100),
  supportEmail: z.string().email("Valid email required"),
  supportPhone: z.string().optional(),
  termsUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  privacyUrl: z.string().url("Valid URL required").optional().or(z.literal("")),
  allowRegistrations: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  defaultCurrency: z.string().default("KES"),
  defaultTimezone: z.string().default("Africa/Nairobi"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName: "PartyPass",
      platformFeePercent: 5,
      supportEmail: "support@partypass.com",
      supportPhone: "+254700000000",
      termsUrl: "https://partypass.com/terms",
      privacyUrl: "https://partypass.com/privacy",
      allowRegistrations: true,
      requireEmailVerification: true,
      maintenanceMode: false,
      defaultCurrency: "KES",
      defaultTimezone: "Africa/Nairobi",
    },
  });

  useEffect(() => {
    settingsApi.get().then((res) => {
      const data = unwrap<Partial<SettingsFormData>>(res);
      if (data) reset({ ...data } as SettingsFormData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setError(null);
    setSuccess(false);
    try {
      await settingsApi.update(data as unknown as Record<string, unknown>);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message || "Failed to save settings.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure platform settings</p>
      </div>

      {success && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-[#D93B2F]" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Platform Name</Label>
              <Input {...register("platformName")} />
              {errors.platformName && (
                <p className="text-xs text-red-500">{errors.platformName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Default Currency</Label>
              <Input {...register("defaultCurrency")} />
            </div>
            <div className="space-y-1.5">
              <Label>Default Timezone</Label>
              <Input {...register("defaultTimezone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Support Email</Label>
              <Input type="email" {...register("supportEmail")} />
              {errors.supportEmail && (
                <p className="text-xs text-red-500">{errors.supportEmail.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Support Phone</Label>
              <Input {...register("supportPhone")} />
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-[#D93B2F]" />
              Billing & Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Platform Fee (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                {...register("platformFeePercent")}
              />
              {errors.platformFeePercent && (
                <p className="text-xs text-red-500">{errors.platformFeePercent.message}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Percentage taken from each ticket sale
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[#D93B2F]" />
              Legal Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Terms of Service URL</Label>
              <Input type="url" {...register("termsUrl")} />
              {errors.termsUrl && (
                <p className="text-xs text-red-500">{errors.termsUrl.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Privacy Policy URL</Label>
              <Input type="url" {...register("privacyUrl")} />
              {errors.privacyUrl && (
                <p className="text-xs text-red-500">{errors.privacyUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Platform flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-[#D93B2F]" />
              Platform Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Allow New Registrations</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Toggle to stop new user sign-ups</p>
              </div>
              <Switch
                defaultChecked
                onCheckedChange={(v) => setValue("allowRegistrations", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Require Email Verification</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Users must verify email before buying tickets</p>
              </div>
              <Switch
                defaultChecked
                onCheckedChange={(v) => setValue("requireEmailVerification", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Maintenance Mode</p>
                <p className="text-xs text-red-400 dark:text-red-500">Shows maintenance page to all users</p>
              </div>
              <Switch
                onCheckedChange={(v) => setValue("maintenanceMode", v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
