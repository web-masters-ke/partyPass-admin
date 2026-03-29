"use client";
import { useEffect, useRef, useState } from "react";
import { adminWaitingRoomApi, eventsApi, unwrap } from "@/lib/api";

type EventOption = { id: string; title: string; startDateTime: string };
type RoomStatus = {
  active: boolean;
  queueSize: number;
  admittedCount: number;
  eventId?: string;
};

export default function AdminWaitingRoomPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [status, setStatus] = useState<RoomStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [batchSize, setBatchSize] = useState(50);
  const [admitting, setAdmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    eventsApi.list({ limit: 100 }).then((r) => {
      const d = unwrap<{ items: EventOption[] } | EventOption[]>(r);
      const list = Array.isArray(d) ? d : d.items ?? [];
      setEvents(list);
    }).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedEvent) { setStatus(null); return; }
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedEvent]);

  const fetchStatus = () => {
    if (!selectedEvent) return;
    setLoading(true);
    adminWaitingRoomApi.status(selectedEvent)
      .then((r) => setStatus(unwrap<RoomStatus>(r)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const doAction = async (action: "activate" | "deactivate" | "admit") => {
    if (!selectedEvent) return;
    setActionMsg(null);
    if (action === "admit") {
      setAdmitting(true);
      try {
        const r = await adminWaitingRoomApi.admit(selectedEvent, batchSize);
        const d = unwrap<{ admitted: number }>(r);
        setActionMsg({ type: "success", text: `✅ Admitted ${d.admitted ?? batchSize} people` });
        fetchStatus();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Admit failed";
        setActionMsg({ type: "error", text: msg });
      } finally { setAdmitting(false); }
    } else {
      try {
        if (action === "activate") await adminWaitingRoomApi.activate(selectedEvent);
        else await adminWaitingRoomApi.deactivate(selectedEvent);
        setActionMsg({ type: "success", text: `✅ Waiting room ${action}d` });
        fetchStatus();
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Action failed";
        setActionMsg({ type: "error", text: msg });
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Virtual Waiting Room</h1>
        {selectedEvent && (
          <button onClick={fetchStatus} className="text-sm text-[#D93B2F] font-semibold hover:underline">
            Refresh
          </button>
        )}
      </div>

      {/* Event picker */}
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
          {/* Status cards */}
          {loading && !status ? (
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
            </div>
          ) : status && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${status.active ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                <p className="text-xs text-gray-400 mb-1">Room Status</p>
                <p className={`text-lg font-extrabold ${status.active ? "text-green-600" : "text-gray-400"}`}>
                  {status.active ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-extrabold text-[#D93B2F]">{status.queueSize ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">In Queue</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                <p className="text-3xl font-extrabold text-green-600">{status.admittedCount ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">Admitted</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Room Controls</h2>

            {actionMsg && (
              <div className={`rounded-xl px-4 py-2.5 text-sm ${actionMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {actionMsg.text}
              </div>
            )}

            {/* Activate / Deactivate */}
            <div className="flex gap-3">
              <button
                onClick={() => doAction("activate")}
                disabled={status?.active}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-40"
              >
                ▶ Activate Room
              </button>
              <button
                onClick={() => doAction("deactivate")}
                disabled={!status?.active}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2.5 rounded-xl text-sm border border-red-200 transition disabled:opacity-40"
              >
                ⏹ Deactivate Room
              </button>
            </div>

            {/* Admit batch */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Admit Next Batch</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
                <span className="text-sm text-gray-500">people</span>
                <button
                  onClick={() => doAction("admit")}
                  disabled={admitting || !status?.active || (status?.queueSize ?? 0) === 0}
                  className="bg-[#D93B2F] hover:bg-[#b02b20] text-white font-semibold px-5 py-2 rounded-full text-sm transition disabled:opacity-60"
                >
                  {admitting ? "Admitting…" : "Admit Batch"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Admitted users get a 15-minute window to complete checkout.
              </p>
            </div>

            {/* Auto-poll note */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700">
              ℹ️ Queue stats auto-refresh every 10 seconds. Activate the room before the event goes on sale.
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">How it works</h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[#D93B2F]/10 text-[#D93B2F] font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>Activate the room before tickets go on sale.</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[#D93B2F]/10 text-[#D93B2F] font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>Users who visit the event page join the queue automatically.</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[#D93B2F]/10 text-[#D93B2F] font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>Click &quot;Admit Batch&quot; to let the next N users through to checkout.</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-[#D93B2F]/10 text-[#D93B2F] font-bold flex items-center justify-center text-xs flex-shrink-0">4</span>Admitted users have 15 minutes to complete purchase or they go back to the queue.</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
