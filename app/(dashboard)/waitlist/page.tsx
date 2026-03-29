"use client";
import { useEffect, useState } from "react";
import { adminWaitlistApi, eventsApi, unwrap } from "@/lib/api";

type WaitlistEntry = {
  id: string;
  status: string;
  position: number;
  claimExpiresAt?: string;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  tier?: { name: string };
};

type EventOption = { id: string; title: string };

const STATUS_BADGE: Record<string, string> = {
  WAITING: "bg-yellow-100 text-yellow-700",
  NOTIFIED: "bg-green-100 text-green-700",
  AVAILABLE: "bg-green-100 text-green-700",
  CLAIMED: "bg-blue-100 text-blue-600",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default function AdminWaitlistPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifyCount, setNotifyCount] = useState(5);

  useEffect(() => {
    eventsApi.list({ limit: 100 }).then((r) => {
      const d = unwrap<{ items: EventOption[] } | EventOption[]>(r);
      setEvents(Array.isArray(d) ? d : d.items ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEvent) { setEntries([]); return; }
    setLoading(true);
    adminWaitlistApi.eventWaitlist(selectedEvent)
      .then((r) => {
        const d = unwrap<WaitlistEntry[] | { items: WaitlistEntry[] }>(r);
        setEntries(Array.isArray(d) ? d : d.items ?? []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  const handleNotify = async () => {
    if (!selectedEvent) return;
    setNotifying(true); setMsg(null);
    try {
      const r = await adminWaitlistApi.notifyNext(selectedEvent, notifyCount);
      const d = unwrap<{ notified: number }>(r);
      setMsg({ type: "success", text: `Notified ${d.notified ?? notifyCount} waitlisted users.` });
      // Reload
      adminWaitlistApi.eventWaitlist(selectedEvent).then((r2) => {
        const d2 = unwrap<WaitlistEntry[] | { items: WaitlistEntry[] }>(r2);
        setEntries(Array.isArray(d2) ? d2 : d2.items ?? []);
      });
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not notify users";
      setMsg({ type: "error", text: errMsg });
    } finally { setNotifying(false); }
  };

  const waiting = entries.filter(e => e.status === "WAITING").length;
  const notified = entries.filter(e => e.status === "NOTIFIED" || e.status === "AVAILABLE").length;
  const claimed = entries.filter(e => e.status === "CLAIMED").length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>

      {/* Event selector */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <label className="text-sm font-semibold text-gray-700 block mb-2">Select Event</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D93B2F]"
        >
          <option value="">— Select an event —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Waiting", value: waiting, color: "text-yellow-600" },
              { label: "Notified", value: notified, color: "text-green-600" },
              { label: "Claimed", value: claimed, color: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Notify panel */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Notify Next in Queue</h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={50}
                value={notifyCount}
                onChange={(e) => setNotifyCount(Number(e.target.value))}
                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <span className="text-sm text-gray-500">people</span>
              <button
                onClick={handleNotify}
                disabled={notifying || waiting === 0}
                className="bg-[#D93B2F] hover:bg-[#b02b20] text-white font-semibold px-5 py-2 rounded-full text-sm transition disabled:opacity-60"
              >
                {notifying ? "Notifying…" : "Send Notifications"}
              </button>
            </div>
            {msg && (
              <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {msg.text}
              </div>
            )}
          </div>

          {/* Entries table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Waitlist Entries ({entries.length})</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No waitlist entries for this event</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["#", "User", "Email", "Tier", "Status", "Joined"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.sort((a, b) => a.position - b.position).map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-gray-400">#{e.position}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {[e.user?.firstName, e.user?.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{e.user?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{e.tier?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString("en-KE")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
