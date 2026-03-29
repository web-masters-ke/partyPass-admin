"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle2, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organizerApi, unwrap } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface WalletData {
  grossRevenue: number;
  platformFees: number;
  netEarnings: number;
  paidOut: number;
  inProgress: number;
  availableToWithdraw: number;
  currency: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  phone: string;
  mpesaRef?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  COMPLETED: "success",
  APPROVED: "info",
  PROCESSING: "info",
  PENDING: "warning",
  FAILED: "destructive",
  REJECTED: "destructive",
  CANCELLED: "secondary",
};

export default function OrganizerWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  // Payout settings
  const [settingsMpesaPhone, setSettingsMpesaPhone] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [walletRes, payoutsRes] = await Promise.all([
        organizerApi.wallet(),
        organizerApi.payouts({ limit: 10 }),
      ]);
      setWallet(unwrap<WalletData>(walletRes));
      const pd = unwrap<{ items: Payout[] }>(payoutsRes);
      setPayouts(pd.items ?? []);
    } catch {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settingsMpesaPhone.trim()) { toast.error("Enter your M-Pesa phone"); return; }
    setSavingSettings(true);
    try {
      await organizerApi.updatePayoutSettings({ mpesaPhone: settingsMpesaPhone.trim() });
      toast.success("Payout settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const requestPayout = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Minimum withdrawal is KES 100"); return; }
    if (!phone.trim()) { toast.error("Enter your M-Pesa phone number"); return; }

    setRequesting(true);
    try {
      await organizerApi.requestPayout({ amount: amt, phone: phone.trim(), notes: notes.trim() || undefined });
      toast.success("Payout request submitted! Admin will approve within 1 business day.");
      setShowForm(false);
      setAmount(""); setPhone(""); setNotes("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Wallet</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your earnings from ticket sales</p>
      </div>

      {/* Available balance — hero card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#D93B2F] to-[#b52a20] p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">Available to Withdraw</p>
            <p className="mt-1 text-4xl font-black">
              {formatCurrency(wallet?.availableToWithdraw ?? 0)}
            </p>
            <p className="mt-1 text-sm text-white/70">KES</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Wallet className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            disabled={(wallet?.availableToWithdraw ?? 0) < 100}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#D93B2F] transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gross Ticket Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(wallet?.grossRevenue ?? 0)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Platform Fee (5%)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  -{formatCurrency(wallet?.platformFees ?? 0)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Already Paid Out</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(wallet?.paidOut ?? 0)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(wallet?.inProgress ?? 0)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal form */}
      {showForm && (
        <Card className="border-[#D93B2F]/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-[#D93B2F]" />
              Request Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400">
              Payouts are processed via M-Pesa B2C within 1 business day after admin approval. Minimum withdrawal: KES 100.
            </div>
            <div className="space-y-1.5">
              <Label>Amount (KES) *</Label>
              <Input
                type="number"
                min={100}
                max={wallet?.availableToWithdraw}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Available: {formatCurrency(wallet?.availableToWithdraw ?? 0)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>M-Pesa Phone Number *</Label>
              <Input
                type="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g. Payment for Afro Fridays Vol. 12"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={requestPayout}
                disabled={requesting}
                className="bg-[#D93B2F] hover:bg-[#b52a20] text-white"
              >
                {requesting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>M-Pesa Phone (for B2C payouts)</Label>
            <div className="flex gap-3">
              <Input
                type="tel"
                placeholder="e.g. 0712345678"
                value={settingsMpesaPhone}
                onChange={(e) => setSettingsMpesaPhone(e.target.value)}
              />
              <Button onClick={saveSettings} disabled={savingSettings} variant="outline">
                {savingSettings ? "Saving..." : "Save"}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              This phone will receive M-Pesa payments when admin approves your withdrawal requests.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payout history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No payout requests yet</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(p.amount)}
                      </p>
                      <Badge variant={STATUS_BADGE[p.status] ?? "secondary"} className="text-xs">
                        {p.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {p.phone} · {formatDateTime(p.requestedAt)}
                    </p>
                    {p.mpesaRef && (
                      <p className="mt-0.5 font-mono text-xs text-gray-400">
                        Ref: {p.mpesaRef}
                      </p>
                    )}
                    {p.notes && <p className="mt-0.5 text-xs text-gray-400 italic">{p.notes}</p>}
                  </div>
                  {p.status === "COMPLETED" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {p.status === "PROCESSING" && (
                    <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
