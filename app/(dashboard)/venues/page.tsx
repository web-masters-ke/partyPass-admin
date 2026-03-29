"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Plus, Search, Edit2, Trash2, X, Check, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { venuesApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity?: number;
  logoUrl?: string;
  bannerUrl?: string;
  amenities: string[];
  _count?: { events: number };
}

const EMPTY: Partial<Venue> & { amenitiesRaw: string } = {
  name: "",
  address: "",
  city: "Nairobi",
  country: "Kenya",
  capacity: undefined,
  amenitiesRaw: "",
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load(search?: string) {
    setLoading(true);
    try {
      const res = await venuesApi.list(search ? { search } : {});
      const data = unwrap<Venue[] | { items: Venue[] }>(res);
      setVenues(Array.isArray(data) ? data : data.items ?? []);
    } catch { setVenues([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(v: Venue) {
    setEditing(v);
    setForm({ ...v, amenitiesRaw: v.amenities?.join(", ") || "" });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.address || !form.city) {
      toast.error("Name, address and city are required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        address: form.address,
        city: form.city,
        country: form.country || "Kenya",
        capacity: form.capacity ? Number(form.capacity) : undefined,
        amenities: form.amenitiesRaw ? form.amenitiesRaw.split(",").map(a => a.trim()).filter(Boolean) : [],
      };

      if (editing) {
        await venuesApi.update(editing.id, payload);
        toast.success("Venue updated");
      } else {
        await venuesApi.create(payload);
        toast.success("Venue created");
      }
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save venue");
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete this venue? This cannot be undone.")) return;
    try {
      await venuesApi.delete(id);
      toast.success("Venue deleted");
      load();
    } catch { toast.error("Failed to delete venue"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Venues</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage all registered venues</p>
        </div>
        <Button onClick={openNew} className="gap-1.5 bg-[#D93B2F] hover:bg-[#b52e24]">
          <Plus className="h-4 w-4" /> Add Venue
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search venues…" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)} />
      </div>

      {/* Venue form */}
      {showForm && (
        <Card className="border-[#D93B2F]/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Venue" : "Add New Venue"}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Venue Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kiza Lounge" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">City *</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Nairobi" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Address *</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Country</label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Kenya" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Capacity</label>
                <Input type="number" value={form.capacity ?? ""} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || undefined })} placeholder="500" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Amenities (comma separated)</label>
                <Input value={form.amenitiesRaw} onChange={(e) => setForm({ ...form, amenitiesRaw: e.target.value })} placeholder="Parking, VIP section, Bar, Dance floor" />
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

      {/* Venues grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No venues yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v) => (
            <Card key={v.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative">
                {v.bannerUrl && <img src={v.bannerUrl} alt="" className="w-full h-full object-cover" />}
                {v.logoUrl && (
                  <div className="absolute bottom-2 left-2 w-9 h-9 rounded-lg overflow-hidden border-2 border-white bg-white">
                    <img src={v.logoUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <CardContent className="pt-3 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{v.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" /> {v.city}
                    </p>
                    {v.capacity && <p className="text-xs text-gray-400 mt-0.5">👥 {v.capacity.toLocaleString()}</p>}
                    {v._count?.events != null && (
                      <p className="text-xs text-gray-400 mt-0.5">📅 {v._count.events} event{v._count.events !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Link href={`/venues/${v.id}`}>
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="View Analytics">
                        <BarChart2 className="h-3.5 w-3.5 text-blue-400" />
                      </button>
                    </Link>
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => del(v.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
                {v.amenities?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">{a}</span>
                    ))}
                    {v.amenities.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{v.amenities.length - 3}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
