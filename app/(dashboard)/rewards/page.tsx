"use client";

import { useEffect, useState } from "react";
import { Gift, Plus, Edit2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { rewardsApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";

interface Reward {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  pointsCost: number;
  stock?: number;
  redeemedCount: number;
  status: "ACTIVE" | "INACTIVE" | "SOLD_OUT";
  minTier: string;
  validUntil?: string;
  _count?: { redemptions: number };
}

const CATEGORIES = ["OTHER", "FREE_TICKET", "DRINK_VOUCHER", "FOOD_VOUCHER", "MERCH", "VIP_UPGRADE", "DISCOUNT", "EXPERIENCE"];
const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];

const EMPTY_FORM = {
  name: "", description: "", category: "OTHER", pointsCost: 500,
  stock: "" as string | number, minTier: "BRONZE", validUntil: "",
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await rewardsApi.list();
      const data = unwrap<Reward[] | { items: Reward[] }>(res);
      setRewards(Array.isArray(data) ? data : data.items ?? []);
    } catch { setRewards([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(r: Reward) {
    setEditing(r);
    setForm({
      name: r.name, description: r.description, category: r.category,
      pointsCost: r.pointsCost, stock: r.stock ?? "",
      minTier: r.minTier, validUntil: r.validUntil ? r.validUntil.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.description || !form.pointsCost) {
      toast.error("Name, description and points cost are required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, description: form.description,
        category: form.category, pointsCost: Number(form.pointsCost),
        stock: form.stock !== "" ? Number(form.stock) : undefined,
        minTier: form.minTier,
        validUntil: form.validUntil || undefined,
      };
      if (editing) {
        await rewardsApi.update(editing.id, payload);
        toast.success("Reward updated");
      } else {
        await rewardsApi.create(payload);
        toast.success("Reward created");
      }
      setShowForm(false);
      load();
    } catch { toast.error("Failed to save reward"); }
    finally { setSaving(false); }
  }

  async function toggle(r: Reward) {
    try {
      const newStatus = r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await rewardsApi.update(r.id, { status: newStatus });
      toast.success(newStatus === "ACTIVE" ? "Reward activated" : "Reward deactivated");
      load();
    } catch { toast.error("Failed to update reward"); }
  }

  const TIER_COLORS: Record<string, string> = {
    BRONZE: "text-amber-600", SILVER: "text-gray-500",
    GOLD: "text-yellow-500", PLATINUM: "text-blue-500", DIAMOND: "text-purple-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reward Catalog</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage redeemable rewards for loyalty members</p>
        </div>
        <Button onClick={openNew} className="gap-1.5 bg-[#D93B2F] hover:bg-[#b52e24]">
          <Plus className="h-4 w-4" /> Add Reward
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Rewards", value: rewards.length },
          { label: "Active", value: rewards.filter(r => r.status === "ACTIVE").length },
          { label: "Total Redemptions", value: rewards.reduce((s, r) => s + (r._count?.redemptions ?? r.redeemedCount ?? 0), 0) },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-[#D93B2F]/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Reward" : "New Reward"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Reward Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Free Drink Voucher" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Description *</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does the user get?" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
                <select className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Minimum Tier</label>
                <select className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2"
                  value={form.minTier} onChange={(e) => setForm({ ...form, minTier: e.target.value })}>
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Points Cost *</label>
                <Input type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: Number(e.target.value) })} placeholder="500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Stock (blank = unlimited)</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="100" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Valid Until (optional)</label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={save} disabled={saving} className="bg-[#D93B2F] hover:bg-[#b52e24] gap-1.5">
                <Check className="h-4 w-4" /> {saving ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No rewards yet</p>
          <p className="text-sm mt-1">Create your first reward to get started</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((r) => (
            <Card key={r.id} className={`overflow-hidden ${r.status !== "ACTIVE" ? "opacity-60" : ""}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{r.description}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => toggle(r)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      {r.status === "ACTIVE"
                        ? <ToggleRight className="h-4 w-4 text-green-500" />
                        : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-black text-[#D93B2F]">{r.pointsCost.toLocaleString()} pts</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`font-medium ${TIER_COLORS[r.minTier] ?? ""}`}>{r.minTier}+</span>
                    {r.stock != null && <span>Stock: {r.stock - r.redeemedCount}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                    r.status === "SOLD_OUT" ? "bg-orange-100 text-orange-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>{r.status.replace(/_/g, " ")}</span>
                  <span className="text-xs text-gray-400">{(r._count?.redemptions ?? r.redeemedCount).toLocaleString()} redeemed</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
