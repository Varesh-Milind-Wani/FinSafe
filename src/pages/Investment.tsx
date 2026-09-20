import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  Wallet, X, Check, IndianRupee
} from "lucide-react";
import type { Investment, InvestmentType, UserAccount } from "../types/finance";
import { formatCurrency } from "../utils/money";

interface Props {
  user: UserAccount;
  onSave: (updatedUser: UserAccount) => void;
}

const TYPE_LABELS: Record<InvestmentType, string> = {
  stocks: "Stocks",
  mutual_fund: "Mutual Fund",
  crypto: "Crypto",
  gold: "Gold",
  real_estate: "Real Estate",
  fd: "Fixed Deposit",
  other: "Other",
};

const TYPE_COLORS: Record<InvestmentType, string> = {
  stocks: "#3b82f6",
  mutual_fund: "#10b981",
  crypto: "#f59e0b",
  gold: "#eab308",
  real_estate: "#8b5cf6",
  fd: "#06b6d4",
  other: "#6b7280",
};

const emptyForm = (): Omit<Investment, "id"> => ({
  name: "",
  type: "stocks",
  amount: 0,
  currentValue: 0,
  date: new Date().toISOString().split("T")[0],
  note: "",
});

const InvestmentPage = ({ user, onSave }: Props) => {
  const investments = user.investments ?? [];
  const currency = user.currency ?? "INR";

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [filterType, setFilterType] = useState<InvestmentType | "all">("all");

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
    const pnl = totalCurrent - totalInvested;
    const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, pnl, pnlPct };
  }, [investments]);

  const filtered = useMemo(() =>
    filterType === "all" ? investments : investments.filter(i => i.type === filterType),
    [investments, filterType]
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (inv: Investment) => {
    setEditing(inv);
    setForm({ name: inv.name, type: inv.type, amount: inv.amount, currentValue: inv.currentValue, date: inv.date.split("T")[0], note: inv.note });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    const list = [...investments];
    if (editing) {
      const idx = list.findIndex(i => i.id === editing.id);
      if (idx !== -1) list[idx] = { ...editing, ...form };
    } else {
      list.unshift({ id: crypto.randomUUID(), ...form });
    }
    onSave({ ...user, investments: list });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this investment?")) return;
    onSave({ ...user, investments: investments.filter(i => i.id !== id) });
  };

  const fmt = (v: number) => formatCurrency(v, currency);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Investment Portfolio</h1>
          <p className="page-subtitle">Track and manage your investments in one place.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Investment
        </button>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">TOTAL INVESTED</span>
            <div className="stat-card-icon blue"><Wallet size={19} /></div>
          </div>
          <div className="stat-card-value">{fmt(stats.totalInvested)}</div>
          <div className="stat-card-subtitle positive">{investments.length} investments</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">CURRENT VALUE</span>
            <div className="stat-card-icon green"><IndianRupee size={19} /></div>
          </div>
          <div className="stat-card-value">{fmt(stats.totalCurrent)}</div>
          <div className="stat-card-subtitle positive">Portfolio value</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">TOTAL P&L</span>
            <div className={`stat-card-icon ${stats.pnl >= 0 ? "green" : "red"}`}>
              {stats.pnl >= 0 ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
            </div>
          </div>
          <div className="stat-card-value" style={{ color: stats.pnl >= 0 ? "#10b981" : "#ef4444" }}>
            {stats.pnl >= 0 ? "+" : ""}{fmt(stats.pnl)}
          </div>
          <div className={`stat-card-subtitle ${stats.pnl >= 0 ? "positive" : "negative"}`}>
            {stats.pnlPct >= 0 ? "+" : ""}{stats.pnlPct.toFixed(2)}% return
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">UNREALISED GAIN</span>
            <div className={`stat-card-icon ${stats.pnl >= 0 ? "green" : "red"}`}>
              <TrendingUp size={19} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: stats.pnl >= 0 ? "#10b981" : "#ef4444" }}>
            {stats.pnlPct.toFixed(1)}%
          </div>
          <div className="stat-card-subtitle">Overall ROI</div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", ...Object.keys(TYPE_LABELS)] as (InvestmentType | "all")[]).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1.5px solid ${filterType === t ? "#3b82f6" : "rgba(59,130,246,0.2)"}`,
              background: filterType === t ? "rgba(59,130,246,0.2)" : "rgba(30,41,59,0.6)",
              color: filterType === t ? "#60a5fa" : "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t === "all" ? "All Types" : TYPE_LABELS[t as InvestmentType]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="enterprise-table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>TYPE</th>
              <th>DATE</th>
              <th>INVESTED</th>
              <th>CURRENT VALUE</th>
              <th>P&L</th>
              <th>RETURN %</th>
              <th>NOTE</th>
              <th style={{ textAlign: "center" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "#5e6b80" }}>
                  <Wallet size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                  <p>No investments yet. Click <strong>Add Investment</strong> to get started.</p>
                </td>
              </tr>
            ) : (
              filtered.map(inv => {
                const pnl = inv.currentValue - inv.amount;
                const pct = inv.amount > 0 ? (pnl / inv.amount) * 100 : 0;
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: "#e2e8f0" }}>{inv.name}</td>
                    <td>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${TYPE_COLORS[inv.type]}22`,
                        color: TYPE_COLORS[inv.type],
                        border: `1px solid ${TYPE_COLORS[inv.type]}44`,
                      }}>
                        {TYPE_LABELS[inv.type]}
                      </span>
                    </td>
                    <td style={{ color: "#9aa5ba", fontSize: 13 }}>
                      {new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ color: "#e2e8f0", fontWeight: 600 }}>{fmt(inv.amount)}</td>
                    <td style={{ color: "#e2e8f0", fontWeight: 600 }}>{fmt(inv.currentValue)}</td>
                    <td style={{ color: pnl >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                      {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                    </td>
                    <td style={{ color: pct >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                      {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                    </td>
                    <td style={{ color: "#9aa5ba", fontSize: 12, maxWidth: 160 }}>{inv.note || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        <button className="action-button" onClick={() => openEdit(inv)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="action-button delete" onClick={() => handleDelete(inv.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="transaction-modal" role="dialog" aria-modal="true" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-header-text">
                <span className="eyebrow">{editing ? "EDIT INVESTMENT" : "NEW INVESTMENT"}</span>
                <h2>{editing ? "Edit Investment" : "Add Investment"}</h2>
                <p>Record your investment details below.</p>
              </div>
              <button className="close-button" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-form" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 0 8px" }}>
              {/* Name */}
              <label className="form-group">
                <span className="field-label-text">Investment Name</span>
                <input
                  className="form-input"
                  placeholder="e.g. Reliance Industries"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </label>

              {/* Type */}
              <label className="form-group">
                <span className="field-label-text">Type</span>
                <select
                  className="form-input"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as InvestmentType }))}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>

              {/* Amount & Current Value */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="form-group">
                  <span className="field-label-text">Amount Invested (₹)</span>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={form.amount || ""}
                    onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  />
                </label>
                <label className="form-group">
                  <span className="field-label-text">Current Value (₹)</span>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={form.currentValue || ""}
                    onChange={e => setForm(f => ({ ...f, currentValue: Number(e.target.value) }))}
                  />
                </label>
              </div>

              {/* Date */}
              <label className="form-group">
                <span className="field-label-text">Date</span>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </label>

              {/* Note */}
              <label className="form-group">
                <span className="field-label-text">Note (optional)</span>
                <input
                  className="form-input"
                  placeholder="e.g. Long term holding"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                />
              </label>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                  <Check size={15} /> {editing ? "Save Changes" : "Add Investment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentPage;
