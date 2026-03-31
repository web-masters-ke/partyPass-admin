"use client";
import { useEffect, useState, useCallback } from "react";
import { adminWalletApi, unwrap } from "@/lib/api";
import toast from "react-hot-toast";

type WalletStats = {
  totalWallets: number;
  totalBalance: number;
  totalTopups: number;
  totalSpent: number;
  pendingTopups: number;
  currency: string;
};

type UserWallet = {
  id: string;
  balance: number;
  currency: string;
  isActive: boolean;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    loyaltyTier: string;
    role: string;
  };
};

type WalletTx = {
  id: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  createdAt: string;
  wallet?: { user?: { firstName?: string; lastName?: string; email?: string } };
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-500",
  REVERSED: "bg-gray-100 text-gray-500",
};

const TIER_BADGE: Record<string, string> = {
  BRONZE: "bg-amber-50 text-amber-700",
  SILVER: "bg-gray-100 text-gray-600",
  GOLD: "bg-yellow-100 text-yellow-700",
  PLATINUM: "bg-slate-100 text-slate-600",
  DIAMOND: "bg-cyan-100 text-cyan-700",
};

const TYPE_LABEL: Record<string, string> = {
  TOPUP: "Top-up", PAYMENT: "Payment", REFUND: "Refund",
  CASHBACK: "Cashback", ADJUSTMENT: "Adjustment",
};

type Modal =
  | { type: "credit"; wallet: UserWallet }
  | { type: "transfer"; from: UserWallet }
  | null;

export default function AdminWalletsPage() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"wallets" | "transactions">("wallets");
  const limit = 25;

  // Modal state
  const [modal, setModal] = useState<Modal>(null);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voidingTx, setVoidingTx] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    setStatsLoading(true);
    adminWalletApi.stats()
      .then((r) => setStats(unwrap<WalletStats>(r)))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const loadWallets = useCallback(() => {
    setWalletsLoading(true);
    adminWalletApi.users({ search: search || undefined, limit: 100 })
      .then((r) => {
        const d = unwrap<{ items: UserWallet[] } | UserWallet[]>(r);
        setWallets(Array.isArray(d) ? d : (d as { items: UserWallet[] }).items ?? []);
      })
      .catch(() => setWallets([]))
      .finally(() => setWalletsLoading(false));
  }, [search]);

  const loadTxs = useCallback(() => {
    setTxLoading(true);
    adminWalletApi.transactions({ page: txPage, limit })
      .then((r) => {
        const d = unwrap<{ items: WalletTx[]; total: number }>(r);
        setTxs(d.items ?? []);
        setTxTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [txPage]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadWallets(); }, [loadWallets]);
  useEffect(() => { if (tab === "transactions") loadTxs(); }, [tab, loadTxs]);

  async function handleCredit() {
    if (modal?.type !== "credit") return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      await adminWalletApi.credit(modal.wallet.user.id, amt, desc || `Admin credit — ${modal.wallet.user.firstName}`);
      toast.success(`KES ${amt.toLocaleString()} credited to ${modal.wallet.user.firstName}`);
      setModal(null); setAmount(""); setDesc("");
      loadStats(); loadWallets();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Credit failed");
    } finally { setSubmitting(false); }
  }

  async function handleVoidTx(txId: string) {
    if (!confirm("Mark this pending transaction as failed/voided?")) return;
    setVoidingTx(txId);
    try {
      await adminWalletApi.voidTx(txId);
      toast.success("Transaction voided");
      loadTxs(); loadStats();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to void");
    } finally { setVoidingTx(null); }
  }

  async function handleTransfer() {
    if (modal?.type !== "transfer") return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!transferTo.trim()) { toast.error("Select a recipient"); return; }
    if (transferTo === modal.from.user.id) { toast.error("Can't transfer to the same user"); return; }
    setSubmitting(true);
    try {
      await adminWalletApi.transfer(modal.from.user.id, transferTo, amt, desc || "Admin transfer");
      const toUser = wallets.find(w => w.user.id === transferTo);
      toast.success(`KES ${amt.toLocaleString()} transferred to ${toUser?.user.firstName ?? "recipient"}`);
      setModal(null); setAmount(""); setDesc(""); setTransferTo("");
      loadStats(); loadWallets();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Transfer failed");
    } finally { setSubmitting(false); }
  }

  const fmtDate = (d: string) => {
    try { return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d)); }
    catch { return d; }
  };

  const filteredWallets = wallets.filter(w => {
    const q = search.toLowerCase();
    return !q || w.user.firstName.toLowerCase().includes(q) ||
      w.user.lastName.toLowerCase().includes(q) || w.user.email.toLowerCase().includes(q);
  });

  const statCards = stats ? [
    { label: "Total Wallets",       value: stats.totalWallets.toLocaleString(),                                            icon: "👛", color: "bg-blue-50" },
    { label: "Total Balance (KES)", value: `KES ${Number(stats.totalBalance ?? 0).toLocaleString()}`,                      icon: "💰", color: "bg-green-50" },
    { label: "Total Top-ups",       value: `KES ${Number(stats.totalTopups ?? 0).toLocaleString()}`,                       icon: "📈", color: "bg-purple-50" },
    { label: "Total Spent",         value: `KES ${Number(stats.totalSpent ?? 0).toLocaleString()}`,                        icon: "🛒", color: "bg-orange-50" },
    { label: "Pending",             value: stats.pendingTopups.toLocaleString(),                                           icon: "⏳", color: "bg-yellow-50" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <p className="text-sm text-gray-400">Admin wallet oversight + credit / transfer</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 border border-gray-100 shadow-sm ${s.color}`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-lg font-extrabold text-gray-900 truncate">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["wallets", "transactions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "wallets" ? "👛 User Wallets" : "📋 Transactions"}
          </button>
        ))}
      </div>

      {/* User Wallets Tab */}
      {tab === "wallets" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h2 className="font-bold text-gray-900 whitespace-nowrap">User Wallets</h2>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:border-indigo-400" />
            <span className="text-sm text-gray-400 whitespace-nowrap">{filteredWallets.length} wallets</span>
          </div>

          {walletsLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              {search ? "No wallets match your search" : "No wallets found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["User", "Role / Tier", "Balance (KES)", "Status", "Last Updated", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredWallets.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-xs text-gray-400">{w.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit">{w.user.role}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full w-fit font-semibold ${TIER_BADGE[w.user.loyaltyTier] ?? "bg-gray-100 text-gray-500"}`}>
                            {w.user.loyaltyTier}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-base ${Number(w.balance) > 0 ? "text-green-700" : "text-gray-400"}`}>
                          {Number(w.balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${w.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                          {w.isActive ? "Active" : "Frozen"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(w.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setModal({ type: "credit", wallet: w }); setAmount(""); setDesc(""); }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors">
                            + Credit
                          </button>
                          <button onClick={() => { setModal({ type: "transfer", from: w }); setAmount(""); setDesc(""); setTransferTo(""); }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                            Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">All Transactions</h2>
            <span className="text-sm text-gray-400">{txTotal} total</span>
          </div>
          {txLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : txs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No transactions found</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["User", "Type", "Amount", "Status", "Description", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txs.map(tx => {
                    const user = tx.wallet?.user;
                    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "—";
                    const isCredit = tx.type === "TOPUP" || tx.type === "REFUND" || tx.type === "CASHBACK" || tx.type === "ADJUSTMENT";
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{TYPE_LABEL[tx.type] ?? tx.type}</span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${tx.status === "FAILED" ? "text-gray-300 line-through" : isCredit ? "text-green-600" : "text-red-600"}`}>
                          {isCredit ? "+" : "−"} KES {Number(tx.amount).toFixed(0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[tx.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.description || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">
                          {tx.status === "PENDING" && (
                            <button onClick={() => handleVoidTx(tx.id)} disabled={voidingTx === tx.id}
                              className="px-2 py-1 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
                              {voidingTx === tx.id ? "…" : "Void"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {txTotal > limit && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Page {txPage} of {Math.ceil(txTotal / limit)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                    <button onClick={() => setTxPage(p => p + 1)} disabled={txPage * limit >= txTotal}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Credit Modal ─────────────────────────────────────────────────────── */}
      {modal?.type === "credit" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Credit Wallet</h3>
              <p className="text-sm text-gray-400 mt-1">
                Adding funds to <span className="font-semibold text-gray-700">{modal.wallet.user.firstName} {modal.wallet.user.lastName}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Current balance</span>
                <span className="text-xl font-black text-green-700">KES {Number(modal.wallet.balance).toLocaleString()}</span>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(q => (
                    <button key={q} onClick={() => setAmount(String(q))}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors">
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Test credit, goodwill adjustment…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCredit} disabled={submitting || !amount}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                {submitting ? "Crediting…" : `Credit KES ${parseFloat(amount || "0").toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ───────────────────────────────────────────────────── */}
      {modal?.type === "transfer" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Transfer Funds</h3>
              <p className="text-sm text-gray-400 mt-1">
                From <span className="font-semibold text-gray-700">{modal.from.user.firstName} {modal.from.user.lastName}</span>
                {" "}(KES {Number(modal.from.balance).toLocaleString()})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Send To</label>
                <select value={transferTo} onChange={e => setTransferTo(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="">Select recipient…</option>
                  {wallets
                    .filter(w => w.user.id !== modal.from.user.id)
                    .map(w => (
                      <option key={w.user.id} value={w.user.id}>
                        {w.user.firstName} {w.user.lastName} — {w.user.email} (KES {Number(w.balance).toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (KES)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(q => (
                    <button key={q} onClick={() => setAmount(String(q))}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors">
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (optional)</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Refund, transfer for…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleTransfer} disabled={submitting || !amount || !transferTo}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
                {submitting ? "Transferring…" : `Transfer KES ${parseFloat(amount || "0").toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
