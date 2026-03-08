"use client";
import React, { useState, useMemo } from "react";
import { CalculatorIcon, MapIcon, TrendingIcon, ShieldIcon, UsersIcon, HomeIcon } from "@/components/icons";
import Navbar from "@/components/Navbar";

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, d2, size = 18, fill }: { d: string; d2?: string; size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);
const AlertIcon = ({ size = 16 }) => <Icon size={size} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" d2="M12 9v4M12 17h.01" />;
const InfoIcon = ({ size = 16 }) => <Icon size={size} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" d2="M12 8h.01M12 12v4" />;
const CheckIcon = ({ size = 16 }) => <Icon size={size} d="M20 6L9 17l-5-5" />;
const PlusIcon = ({ size = 16 }) => <Icon size={size} d="M12 5v14M5 12h14" />;
const TrashIcon = ({ size = 14 }) => <Icon size={size} d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />;
const ArrowRight = ({ size = 16 }) => <Icon size={size} d="M5 12h14M12 5l7 7-7 7" />;
const ArrowLeft = ({ size = 16 }) => <Icon size={size} d="M19 12H5M12 19l-7-7 7-7" />;
const FileIcon = ({ size = 16 }) => <Icon size={size} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" />;
const SparkleIcon = ({ size = 16 }) => <Icon size={size} d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STEPS = [
  { id: "income", label: "Income", desc: "Your take-home pay" },
  { id: "committed", label: "Committed", desc: "Fixed monthly bills" },
  { id: "savings", label: "Savings", desc: "Emergency fund" },
  { id: "irregular", label: "Irregular", desc: "Annual expenses" },
  { id: "subscriptions", label: "Subscriptions", desc: "Monthly services" },
  { id: "spending", label: "Spending", desc: "Day-to-day costs" },
  { id: "projection", label: "Summary", desc: "Your full picture" },
];

// ── Field ─────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, hint, placeholder = "0" }: { label?: string; value: number; onChange: (n: number) => void; hint?: string; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: focused ? "#1e6b4a" : "#9ca3af", fontWeight: 700, fontSize: "0.95rem", pointerEvents: "none", transition: "color 0.2s" }}>$</span>
        <input
          type="number"
          value={value === 0 ? "" : value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "13px 14px 13px 34px",
            background: focused ? "#fff" : "#f9fafb",
            border: `2px solid ${focused ? "#1e6b4a" : "#e5e7eb"}`,
            borderRadius: 12, color: "#111827",
            fontSize: "1rem", fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            outline: "none", transition: "all 0.2s",
            boxShadow: focused ? "0 0 0 4px rgba(30,107,74,0.08)" : "none",
          }}
        />
      </div>
      {hint && <p style={{ fontSize: "0.73rem", color: "#9ca3af", marginTop: 6, lineHeight: 1.55 }}>{hint}</p>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
function Card({ children, danger = false, style = {} }: { children: React.ReactNode; danger?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ background: danger ? "#fff5f5" : "white", border: `1px solid ${danger ? "#fecaca" : "#e5e7eb"}`, borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────
function Tag({ children, color = "#1e6b4a" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", background: color + "18", color, borderRadius: 100, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────
function Alert({ type = "info", children }: { type?: "info" | "warn" | "danger" | "success"; children: React.ReactNode }) {
  const cfg = {
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: <InfoIcon size={15} /> },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: <AlertIcon size={15} /> },
    danger: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <AlertIcon size={15} /> },
    success: { bg: "#f0f7f4", border: "#a8d5bc", text: "#1e6b4a", icon: <CheckIcon size={15} /> },
  }[type];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, fontSize: "0.82rem", color: cfg.text, lineHeight: 1.6, marginTop: 14 }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ── Pill ──────────────────────────────────────────────────────────────────
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 18px", borderRadius: 100, border: `2px solid ${selected ? "#1e6b4a" : "#e5e7eb"}`, background: selected ? "#1e6b4a" : "white", color: selected ? "white" : "#6b7280", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {label}
    </button>
  );
}

// ── RangeRow ──────────────────────────────────────────────────────────────
function RangeRow({ label, value, onChange, min, max, step, limit }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; limit: number }) {
  const over = value > limit;
  return (
    <div style={{ padding: "14px 18px", background: over ? "#fff5f5" : "white", border: `1px solid ${over ? "#fecaca" : "#e5e7eb"}`, borderRadius: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {over && <Tag color="#ef4444">Over limit</Tag>}
          <span style={{ fontWeight: 800, color: over ? "#ef4444" : "#1e6b4a", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.95rem" }}>{fmt(value)}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: over ? "#ef4444" : "#1e6b4a" }} />
      <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 5 }}>Suggested limit: {fmt(limit)}/mo</p>
    </div>
  );
}

// ── AddRow ────────────────────────────────────────────────────────────────
function AddRow({ namePlaceholder, name, setName, amount, setAmount, onAdd }: { namePlaceholder: string; name: string; setName: (s: string) => void; amount: number; setAmount: (n: number) => void; onAdd: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={namePlaceholder}
        style={{ flex: 1, padding: "11px 14px", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 10, color: "#111827", fontSize: "0.875rem", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }} />
      <div style={{ position: "relative", width: 100 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.85rem", pointerEvents: "none" }}>$</span>
        <input type="number" value={amount || ""} placeholder="0" onChange={e => setAmount(e.target.value === "" ? 0 : Number(e.target.value))}
          style={{ width: "100%", padding: "11px 10px 11px 24px", background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: 10, color: "#111827", fontSize: "0.875rem", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }} />
      </div>
      <button onClick={onAdd}
        style={{ padding: "11px 16px", background: "#1e6b4a", border: "none", borderRadius: 10, color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: "0.82rem", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
        <PlusIcon size={14} /> Add
      </button>
    </div>
  );
}

// ── Nav Buttons ───────────────────────────────────────────────────────────
function NavButtons({ step, maxStep, onNext, nextLabel, nextDisabled }: { step: number; maxStep: number; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return step < maxStep ? (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f3f4f6" }}>
      <button onClick={onNext} disabled={nextDisabled}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", borderRadius: 12, border: "none", background: nextDisabled ? "#c8e6d6" : "#1e6b4a", color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: nextDisabled ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: nextDisabled ? "none" : "0 4px 12px rgba(30,107,74,0.25)", transition: "all 0.15s" }}>
        {nextLabel || "Continue"} <ArrowRight size={15} />
      </button>
    </div>
  ) : null;
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function BudgetPlanner() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // ── State — all empty defaults ──────────────────────────────────────────
  const [takeHome, setTakeHome] = useState(0);
  const [sideIncome, setSideIncome] = useState(0);
  const [rent, setRent] = useState(0);
  const [utilities, setUtilities] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [councilTax, setCouncilTax] = useState(0);
  const [loanRepayments, setLoanRepayments] = useState(0);
  const [childcare, setChildcare] = useState(0);
  const [savingsPct, setSavingsPct] = useState(0);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [irregularItems, setIrregularItems] = useState<{ id: number; name: string; annual: number }[]>([]);
  const [newIrregName, setNewIrregName] = useState("");
  const [newIrregAmt, setNewIrregAmt] = useState(0);
  const [subs, setSubs] = useState<{ id: number; name: string; monthly: number; essential: boolean }[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubAmt, setNewSubAmt] = useState(0);
  const [groceries, setGroceries] = useState(0);
  const [eatingOut, setEatingOut] = useState(0);
  const [transport, setTransport] = useState(0);
  const [clothing, setClothing] = useState(0);
  const [entertainment, setEntertainment] = useState(0);
  const [personal, setPersonal] = useState(0);

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalIncome = takeHome + sideIncome;
  const savingsAmount = Math.round(totalIncome * (savingsPct / 100));
  const committedTotal = rent + utilities + insurance + councilTax + loanRepayments + childcare;
  const subTotal = subs.reduce((s, x) => s + x.monthly, 0);
  const irregularMonthly = irregularItems.reduce((s, x) => s + x.annual, 0) / 12;
  const discretionaryTotal = groceries + eatingOut + transport + clothing + entertainment + personal;
  const totalOutgoings = committedTotal + subTotal + irregularMonthly + discretionaryTotal + savingsAmount;
  const balance = totalIncome - totalOutgoings;
  const emergencyTarget = (rent + utilities + insurance + councilTax + groceries + transport) * 3;
  const emergencyGap = Math.max(0, emergencyTarget - currentSavings);
  const monthsToEmergency = balance > 0 ? Math.ceil(emergencyGap / balance) : null;
  const nonEssentialSubs = subs.filter(s => !s.essential).reduce((t, s) => t + s.monthly, 0);
  const committedRatio = totalIncome > 0 ? (committedTotal / totalIncome) * 100 : 0;
  const availableForDiscretionary = totalIncome - savingsAmount - committedTotal - subTotal - irregularMonthly;

  const projection = useMemo(() => {
    let running = currentSavings;
    return MONTHS.map((month, i) => { running += balance; return { month, balance: running, i }; });
  }, [currentSavings, balance]);
  const firstNeg = projection.findIndex(p => p.balance < 0);

  // ── Gemini PDF generation ────────────────────────────────────────────────
  const generatePDF = async () => {
    setGenerating(true);
    setPdfError(null);
    setPdfContent(null);

    const dataPrompt = `
You are a personal finance analyst. Based on the following budget data, write a clear, structured, and professional financial analysis report that a first-time homebuyer could understand and use.

=== BUDGET DATA ===
Monthly Income: ${totalIncome} (take-home: ${takeHome}, side income: ${sideIncome})
Savings Rate: ${savingsPct}% = ${savingsAmount}/mo
Current Savings: ${currentSavings}
Emergency Fund Target (3 months): ${Math.round(emergencyTarget)}
Emergency Fund Gap: ${Math.round(emergencyGap)}

Committed Expenses (${committedTotal}/mo):
- Rent/Mortgage: ${rent}
- Utilities: ${utilities}
- Council Tax: ${councilTax}
- Insurance: ${insurance}
- Loan Repayments: ${loanRepayments}
- Childcare: ${childcare}

Subscriptions (${subTotal}/mo):
${subs.map(s => `- ${s.name}: ${s.monthly}/mo (${s.essential ? "essential" : "non-essential"})`).join("\n") || "None added"}
Non-essential subscriptions total: ${nonEssentialSubs}/mo

Irregular Annual Expenses (${Math.round(irregularMonthly * 12)}/yr, ${Math.round(irregularMonthly)}/mo reserve):
${irregularItems.map(i => `- ${i.name}: ${i.annual}/yr`).join("\n") || "None added"}

Discretionary Spending (${discretionaryTotal}/mo):
- Groceries: ${groceries}
- Eating out: ${eatingOut}
- Transport: ${transport}
- Clothing: ${clothing}
- Entertainment: ${entertainment}
- Personal: ${personal}

Net Monthly Balance: ${Math.round(balance)} (${balance >= 0 ? "surplus" : "deficit"})
Committed expenses as % of income: ${committedRatio.toFixed(1)}%
12-month projection: ${Math.round(projection[11]?.balance || currentSavings)} by December

=== REPORT FORMAT ===
Write using clear sections with emoji headings. Include:
1. Executive Summary (2-3 sentences — overall financial health rating: Excellent / Good / Needs Attention / Critical)
2. Income & Savings Assessment
3. Committed Expenses Analysis (flag if >50% of income)
4. Subscription Audit (call out non-essential waste)
5. Irregular Expenses (are they adequately reserved for?)
6. Discretionary Spending Review (any categories over sensible limits?)
7. Emergency Fund Status (months covered, time to reach target)
8. 12-Month Outlook (will they be better or worse off?)
9. Top 3 Action Items (specific, numbered, actionable advice)

Keep language plain, direct, and helpful — not jargon-heavy. Be honest even if the picture is negative. Use $ for all currency. Maximum 600 words.
    `.trim();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: dataPrompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setPdfContent(text);
    } catch (e) {
      setPdfError("Failed to generate analysis. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Budget Analysis — HomeWay</title>
      <style>
        body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.7; }
        h1 { font-size: 1.6rem; margin-bottom: 4px; }
        .sub { color: #6b7280; font-size: 0.9rem; margin-bottom: 32px; }
        pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 0.95rem; }
        .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #9ca3af; }
        @media print { body { margin: 20px; } }
      </style></head>
      <body>
        <h1>Budget Analysis Report</h1>
        <div class="sub">Generated by HomeWay · ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</div>
        <pre>${pdfContent}</pre>
        <div class="footer">HomeWay Budget Planner — For personal planning purposes only. Not financial advice.</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  // ── Step content ──────────────────────────────────────────────────────────
  const stepContent = [

    /* 0 — INCOME */
    <div key="income">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>What comes in each month?</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>Enter what actually lands in your account — after tax, pension, and student loan deductions. Don't include your gross salary.</p>
      </div>
      <Field label="Monthly take-home pay" value={takeHome} onChange={setTakeHome} placeholder="e.g. 2800" hint="Your net pay after all deductions" />
      <Field label="Side income / freelance (monthly average)" value={sideIncome} onChange={setSideIncome} placeholder="e.g. 300" hint="Only count income you reliably receive. Leave blank if none." />
      {totalIncome > 0 && (
        <Card style={{ background: "#f0f7f4", border: "1px solid #a8d5bc", marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "#1e6b4a" }}>Total monthly income</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "1.3rem", color: "#1e6b4a" }}>{fmt(totalIncome)}</span>
          </div>
        </Card>
      )}
      <Alert type="info">
        We'll subtract savings <strong>first</strong>, before showing what's left to spend. This "pay yourself first" principle is the most reliable way to actually build savings.
      </Alert>
      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextDisabled={totalIncome === 0} nextLabel="Next: Committed Bills" />
    </div>,

    /* 1 — COMMITTED */
    <div key="committed">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Your fixed monthly bills</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>These leave your account every month no matter what. We isolate them first to see how much is truly left over. Leave any at $0 if they don't apply.</p>
      </div>
      <Field label="Rent / mortgage" value={rent} onChange={setRent} placeholder="e.g. 950" />
      <Field label="Utilities (gas, electric, water, broadband)" value={utilities} onChange={setUtilities} placeholder="e.g. 120" />
      <Field label="Council tax" value={councilTax} onChange={setCouncilTax} placeholder="e.g. 130" />
      <Field label="Insurance (home, car, life)" value={insurance} onChange={setInsurance} placeholder="e.g. 60" />
      <Field label="Loan / credit card repayments" value={loanRepayments} onChange={setLoanRepayments} placeholder="e.g. 200" />
      <Field label="Childcare / school fees" value={childcare} onChange={setChildcare} placeholder="e.g. 0" />

      {committedTotal > 0 && (
        <Card danger={committedRatio > 50}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>Committed total</span>
            <Tag color={committedRatio > 50 ? "#ef4444" : "#1e6b4a"}>{committedRatio.toFixed(0)}% of income</Tag>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: "#f3f4f6", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 4, background: committedRatio > 50 ? "#ef4444" : "#1e6b4a", width: Math.min(committedRatio, 100) + "%", transition: "width 0.4s" }} />
          </div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.4rem", fontWeight: 900, color: committedRatio > 50 ? "#ef4444" : "#111827" }}>
            {fmt(committedTotal)}<span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#9ca3af" }}> /mo</span>
          </p>
        </Card>
      )}
      {committedRatio > 50 && <Alert type="danger">Committed costs are <strong>{committedRatio.toFixed(0)}%</strong> of income — above the 50% ceiling. Very little margin remains for savings or emergencies.</Alert>}
      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextLabel="Next: Savings" />
    </div>,

    /* 2 — SAVINGS */
    <div key="savings">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Savings &amp; emergency fund</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>Savings come out <strong>before</strong> anything discretionary — not from whatever's left at month end. Set your rate, then tell us what you've already saved.</p>
      </div>

      <Card style={{ marginBottom: 18 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Save this % of income each month</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {[0, 5, 10, 15, 20].map(v => <Pill key={v} label={v === 0 ? "Skip for now" : v + "%"} selected={savingsPct === v} onClick={() => setSavingsPct(v)} />)}
        </div>
        {savingsPct > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0", borderTop: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Auto-saved per month</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, color: "#1e6b4a", fontSize: "1.15rem" }}>{fmt(savingsAmount)}</span>
          </div>
        )}
      </Card>

      <Field label="Current accessible savings" value={currentSavings} onChange={setCurrentSavings} placeholder="e.g. 2000" hint="Easily accessible savings only — not pension, investments, or locked accounts" />

      {(currentSavings > 0 || emergencyTarget > 0) && emergencyTarget > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827", marginBottom: 2 }}>Emergency fund tracker</p>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>3-month essential costs target</p>
            </div>
            <Tag color={currentSavings >= emergencyTarget ? "#1e6b4a" : "#f59e0b"}>
              {currentSavings >= emergencyTarget ? "Covered" : "Gap: " + fmt(emergencyGap)}
            </Tag>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Have: {fmt(currentSavings)}</span>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Target: {fmt(emergencyTarget)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "#f3f4f6", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 5, width: Math.min((currentSavings / Math.max(emergencyTarget, 1)) * 100, 100) + "%", background: currentSavings >= emergencyTarget ? "#1e6b4a" : currentSavings > emergencyTarget * 0.5 ? "#f59e0b" : "#ef4444", transition: "width 0.4s" }} />
          </div>
          <p style={{ fontSize: "0.8rem", color: currentSavings >= emergencyTarget ? "#1e6b4a" : "#92400e" }}>
            {currentSavings >= emergencyTarget ? "Emergency fund fully covered." : balance > 0 && monthsToEmergency ? `At current savings rate: ${monthsToEmergency} months to close gap.` : "Increase savings rate or reduce spending to build this buffer."}
          </p>
        </Card>
      )}

      {currentSavings < emergencyTarget && emergencyTarget > 0 && (
        <Alert type="warn">Without a 3-month buffer, one unexpected event can derail your entire financial plan. Build this <strong>before</strong> paying off low-interest debt or investing.</Alert>
      )}
      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextLabel="Next: Irregular Costs" />
    </div>,

    /* 3 — IRREGULAR */
    <div key="irregular">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Annual irregular expenses</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>These hit annually but wreck monthly budgets because people forget to plan for them. Add each one with its yearly cost — we'll convert it to a monthly reserve automatically.</p>
      </div>

      {irregularItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 20px", background: "#f9fafb", border: "2px dashed #e5e7eb", borderRadius: 16, marginBottom: 16 }}>

          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><PlusIcon size={14} /></div>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No irregular expenses added yet.</p>
          <p style={{ fontSize: "0.78rem", color: "#d1d5db", marginTop: 4 }}>Examples: car MOT, dentist, holiday, Christmas, boiler service</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {irregularItems.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{item.name}</p>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 2 }}>{fmt(item.annual)}/yr · {fmt(item.annual / 12)}/mo reserve</p>
            </div>
            <input type="number" value={item.annual || ""} placeholder="0" onChange={e => setIrregularItems(p => p.map(x => x.id === item.id ? { ...x, annual: Number(e.target.value) } : x))}
              style={{ width: 90, padding: "7px 10px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#111827", fontSize: "0.875rem", fontWeight: 600, textAlign: "right", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }} />
            <button onClick={() => setIrregularItems(p => p.filter(x => x.id !== item.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, display: "flex", alignItems: "center" }}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <AddRow namePlaceholder="e.g. Car MOT, Dentist, Holiday" name={newIrregName} setName={setNewIrregName} amount={newIrregAmt} setAmount={setNewIrregAmt}
        onAdd={() => { if (newIrregName && newIrregAmt > 0) { setIrregularItems(p => [...p, { id: Date.now(), name: newIrregName, annual: newIrregAmt }]); setNewIrregName(""); setNewIrregAmt(0); } }} />

      {irregularItems.length > 0 && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: 3 }}>Annual total</p>
              <p style={{ fontWeight: 700, color: "#374151" }}>{fmt(irregularItems.reduce((s, x) => s + x.annual, 0))}</p>
            </div>
            <div style={{ width: 1, height: 36, background: "#f3f4f6" }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginBottom: 3 }}>Monthly reserve needed</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "#1e6b4a" }}>{fmt(irregularMonthly)}/mo</p>
            </div>
          </div>
        </Card>
      )}

      <Alert type="info">Set up a dedicated "sinking fund" savings pot and auto-transfer {irregularMonthly > 0 ? <strong>{fmt(irregularMonthly)}/mo</strong> : "the monthly total"}. When your MOT or boiler arrives, the money's already there.</Alert>
      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextLabel="Next: Subscriptions" />
    </div>,

    /* 4 — SUBSCRIPTIONS */
    <div key="subscriptions">
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Subscription audit</p>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>Add every subscription — streaming, gym, software, everything. Mark each one as essential or not. Most people are shocked by the annual total.</p>
      </div>

      {subs.length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 20px", background: "#f9fafb", border: "2px dashed #e5e7eb", borderRadius: 16, marginBottom: 16 }}>

          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><PlusIcon size={14} /></div>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>No subscriptions added yet.</p>
          <p style={{ fontSize: "0.78rem", color: "#d1d5db", marginTop: 4 }}>Examples: Netflix, Spotify, Gym, Amazon Prime, iCloud</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {subs.map(sub => (
          <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: sub.essential ? "white" : "#fffbeb", border: `1px solid ${sub.essential ? "#e5e7eb" : "#fde68a"}`, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{sub.name}</p>
                <Tag color={sub.essential ? "#1e6b4a" : "#f59e0b"}>{sub.essential ? "Essential" : "Non-essential"}</Tag>
              </div>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{fmt(sub.monthly)}/mo · {fmt(sub.monthly * 12)}/yr</p>
            </div>
            <button onClick={() => setSubs(p => p.map(x => x.id === sub.id ? { ...x, essential: !x.essential } : x))}
              style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Toggle
            </button>
            <button onClick={() => setSubs(p => p.filter(x => x.id !== sub.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, display: "flex", alignItems: "center" }}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <AddRow namePlaceholder="e.g. Netflix, Gym, Spotify" name={newSubName} setName={setNewSubName} amount={newSubAmt} setAmount={setNewSubAmt}
        onAdd={() => { if (newSubName && newSubAmt > 0) { setSubs(p => [...p, { id: Date.now(), name: newSubName, monthly: newSubAmt, essential: false }]); setNewSubName(""); setNewSubAmt(0); } }} />

      {subs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Total monthly", value: fmt(subTotal) + "/mo", color: "#374151" },
            { label: "Annual bleed", value: fmt(subTotal * 12) + "/yr", color: "#ef4444" },
            { label: "Non-essential", value: fmt(nonEssentialSubs) + "/mo", color: "#f59e0b" },
            { label: "Potential saving", value: fmt(nonEssentialSubs * 12) + "/yr", color: "#1e6b4a" },
          ].map(c => (
            <Card key={c.label} style={{ padding: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginBottom: 5 }}>{c.label}</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "1rem", color: c.color }}>{c.value}</p>
            </Card>
          ))}
        </div>
      )}

      {nonEssentialSubs > 30 && <Alert type="warn">You're spending <strong>{fmt(nonEssentialSubs * 12)}/year</strong> on non-essential subscriptions. Cancelling even half frees up <strong>{fmt(nonEssentialSubs * 6)}</strong> annually.</Alert>}
      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextLabel="Next: Day-to-day Spending" />
    </div>,

    /* 5 — SPENDING */
    <div key="spending">
      {(() => {
        const over = discretionaryTotal > availableForDiscretionary && availableForDiscretionary > 0;
        return <>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Day-to-day spending</p>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>These are choices, not obligations. Adjust the sliders to reflect your real monthly spend and see immediately if you're within budget.</p>
          </div>

          {availableForDiscretionary > 0 && (
            <Card danger={over} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: "0.82rem", color: "#6b7280" }}>Available for day-to-day spending</p>
                <p style={{ fontWeight: 800, color: over ? "#ef4444" : "#1e6b4a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fmt(availableForDiscretionary)}/mo</p>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden", marginBottom: over ? 8 : 0 }}>
                <div style={{ height: "100%", borderRadius: 4, transition: "width 0.3s", background: over ? "#ef4444" : "#1e6b4a", width: Math.min((discretionaryTotal / Math.max(availableForDiscretionary, 1)) * 100, 100) + "%" }} />
              </div>
              {over && <p style={{ fontSize: "0.78rem", color: "#991b1b", fontWeight: 600 }}>Overspending by {fmt(discretionaryTotal - availableForDiscretionary)}/mo</p>}
            </Card>
          )}

          <RangeRow label="Groceries & food shopping" value={groceries} onChange={setGroceries} min={0} max={700} step={5} limit={350} />
          <RangeRow label="Eating out & takeaways" value={eatingOut} onChange={setEatingOut} min={0} max={300} step={5} limit={120} />
          <RangeRow label="Transport (fuel, trains)" value={transport} onChange={setTransport} min={0} max={400} step={5} limit={150} />
          <RangeRow label="Clothing & personal care" value={clothing} onChange={setClothing} min={0} max={300} step={5} limit={80} />
          <RangeRow label="Entertainment & hobbies" value={entertainment} onChange={setEntertainment} min={0} max={300} step={5} limit={100} />
          <RangeRow label="Personal / miscellaneous" value={personal} onChange={setPersonal} min={0} max={200} step={5} limit={60} />

          {over && <Alert type="danger">At this spending level you <strong>cannot cover all costs</strong>. Reduce by <strong>{fmt(discretionaryTotal - availableForDiscretionary)}</strong> to break even.</Alert>}
          <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => setStep(s => s + 1)} nextLabel="View Full Summary" />
        </>;
      })()}
    </div>,

    /* 6 — PROJECTION / SUMMARY */
    <div key="projection">
      {(() => {
        // ── Viz data ──────────────────────────────────────────────────────
        const spendSlices = [
          { label: "Committed", val: committedTotal, color: "#1e6b4a" },
          { label: "Savings", val: savingsAmount, color: "#2d8f63" },
          { label: "Subscriptions", val: subTotal, color: "#4caf82" },
          { label: "Irregular", val: irregularMonthly, color: "#7ecba1" },
          { label: "Discretionary", val: discretionaryTotal, color: "#aadfc1" },
          { label: "Balance", val: Math.max(balance, 0), color: "#d4f0e2" },
        ].filter(s => s.val > 0);

        const totalDonut = spendSlices.reduce((s, x) => s + x.val, 0) || 1;

        // SVG donut helpers
        const DONUT_R = 72, DONUT_CX = 90, DONUT_CY = 90, STROKE = 22;
        const circumference = 2 * Math.PI * DONUT_R;
        let offset = 0;
        const donutSegments = spendSlices.map(s => {
          const dash = (s.val / totalDonut) * circumference;
          const gap = circumference - dash;
          const seg = { ...s, dash, gap, offset };
          offset += dash;
          return seg;
        });

        // Financial health score (0-100)
        const healthFactors = [
          savingsPct >= 10 ? 25 : savingsPct >= 5 ? 15 : 0,
          committedRatio <= 40 ? 25 : committedRatio <= 50 ? 15 : 5,
          currentSavings >= emergencyTarget ? 25 : currentSavings >= emergencyTarget * 0.5 ? 12 : 0,
          balance >= 0 ? 25 : 0,
        ];
        const healthScore = healthFactors.reduce((a, b) => a + b, 0);
        const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Needs Work" : "At Risk";
        const healthColor = healthScore >= 80 ? "#1e6b4a" : healthScore >= 60 ? "#2d8f63" : healthScore >= 40 ? "#f59e0b" : "#ef4444";

        // Spending category bars
        const spendCategories = [
          { label: "Committed bills", val: committedTotal, pct: totalIncome > 0 ? (committedTotal / totalIncome) * 100 : 0, safe: 50 },
          { label: "Savings", val: savingsAmount, pct: savingsPct, safe: 10 },
          { label: "Subscriptions", val: subTotal, pct: totalIncome > 0 ? (subTotal / totalIncome) * 100 : 0, safe: 5 },
          { label: "Irregular res.", val: irregularMonthly, pct: totalIncome > 0 ? (irregularMonthly / totalIncome) * 100 : 0, safe: 5 },
          { label: "Day-to-day", val: discretionaryTotal, pct: totalIncome > 0 ? (discretionaryTotal / totalIncome) * 100 : 0, safe: 30 },
        ];

        return <>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: "1.35rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>Your financial picture</p>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.65 }}>A full breakdown of where your money goes and where you're headed.</p>
          </div>

          {/* ── Row 1: Health score + Net balance ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {/* Health score gauge */}
            <Card style={{ padding: 18, textAlign: "center" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Budget health</p>
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={healthColor} strokeWidth="10"
                    strokeDasharray={`${(healthScore / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem", color: healthColor }}>{healthScore}</span>
                </div>
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.82rem", color: healthColor }}>{healthLabel}</p>
            </Card>

            {/* Net balance */}
            <Card danger={balance < 0} style={{ padding: 18, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Monthly net</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.9rem", fontWeight: 900, color: balance >= 0 ? "#1e6b4a" : "#ef4444", lineHeight: 1 }}>
                {balance >= 0 ? "+" : "−"}{fmt(balance)}
              </p>
              <p style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 6 }}>after all outgoings</p>
            </Card>
          </div>

          {/* ── Row 2: Donut chart ── */}
          <Card style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Where your money goes</p>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* SVG Donut */}
              <div style={{ flexShrink: 0 }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {donutSegments.map((seg, i) => (
                    <circle key={i} cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                      fill="none" stroke={seg.color} strokeWidth={STROKE}
                      strokeDasharray={`${seg.dash} ${seg.gap}`}
                      strokeDashoffset={-seg.offset}
                      transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`} />
                  ))}
                  <text x={DONUT_CX} y={DONUT_CY - 8} textAnchor="middle" style={{ fontSize: "0.65rem", fill: "#9ca3af" }}>Income</text>
                  <text x={DONUT_CX} y={DONUT_CY + 10} textAnchor="middle" style={{ fontSize: "1.1rem", fontWeight: 700, fill: "#111827" }}>{fmt(totalIncome)}</text>
                </svg>
              </div>
              {/* Legend */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {spendSlices.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.75rem", color: "#374151", fontWeight: 500 }}>{s.label}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#111827" }}>{fmt(s.val)}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: "#f3f4f6", marginTop: 3 }}>
                        <div style={{ height: "100%", borderRadius: 2, background: s.color, width: Math.round((s.val / totalDonut) * 100) + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Row 3: % of income bars ── */}
          <Card style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>Spending as % of income</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {spendCategories.map(c => {
                const over = c.pct > c.safe;
                return (
                  <div key={c.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 500 }}>{c.label}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {over && <Tag color="#ef4444">Over target</Tag>}
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: over ? "#ef4444" : "#111827" }}>{c.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div style={{ position: "relative", height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 4, background: over ? "#ef4444" : "#1e6b4a", width: Math.min(c.pct, 100) + "%", transition: "width 0.4s" }} />
                      {/* Target marker */}
                      <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: "#d1d5db", left: Math.min(c.safe, 100) + "%" }} />
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 3 }}>Target: ≤{c.safe}% · {fmt(c.val)}/mo</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── Row 4: 4 stat tiles ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Savings rate", value: savingsPct + "%", sub: fmt(savingsAmount) + "/mo", good: savingsPct >= 10 },
              { label: "Emergency fund", value: currentSavings >= emergencyTarget ? "Covered" : Math.round((currentSavings / Math.max(emergencyTarget, 1)) * 100) + "%", sub: fmt(currentSavings) + " saved", good: currentSavings >= emergencyTarget },
              { label: "Committed ratio", value: committedRatio.toFixed(0) + "%", sub: "of income", good: committedRatio <= 50 },
              { label: "Non-essential subs", value: fmt(nonEssentialSubs) + "/mo", sub: fmt(nonEssentialSubs * 12) + "/yr", good: nonEssentialSubs <= 30 },
            ].map(t => (
              <Card key={t.label} style={{ padding: 16 }}>
                <p style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{t.label}</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "1.15rem", color: t.good ? "#1e6b4a" : "#ef4444", marginBottom: 2 }}>{t.value}</p>
                <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{t.sub}</p>
              </Card>
            ))}
          </div>

          {/* ── Row 5: 12-month projection bar chart ── */}
          <Card style={{ marginBottom: 14 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>12-month savings projection</p>
            {/* Line-style chart */}
            {(() => {
              const vals = projection.map(p => p.balance);
              const minV = Math.min(...vals);
              const maxV = Math.max(...vals);
              const range = Math.max(maxV - minV, 1);
              const H = 90, W = 580, pad = 16;
              const pts = vals.map((v, i) => {
                const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
                const y = H - ((v - minV) / range) * (H - 16) - 4;
                return `${x},${y}`;
              }).join(" ");
              const zeroY = H - ((0 - minV) / range) * (H - 16) - 4;

              return (
                <div style={{ overflowX: "auto" }}>
                  <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none" style={{ display: "block" }}>
                    {/* Zero line */}
                    {minV < 0 && <line x1={pad} y1={zeroY} x2={W - pad} y2={zeroY} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />}
                    {/* Filled area */}
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e6b4a" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#1e6b4a" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`${pad},${H - 4} ${pts} ${W - pad},${H - 4}`}
                      fill="url(#lineGrad)" />
                    {/* Line */}
                    <polyline points={pts} fill="none" stroke="#1e6b4a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {/* Dots */}
                    {vals.map((v, i) => {
                      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
                      const y = H - ((v - minV) / range) * (H - 16) - 4;
                      return <circle key={i} cx={x} cy={y} r="3" fill={v < 0 ? "#ef4444" : "#1e6b4a"} />;
                    })}
                    {/* Month labels */}
                    {projection.map((p, i) => {
                      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
                      return <text key={p.month} x={x} y={H + 14} textAnchor="middle" style={{ fontSize: "9px", fill: "#9ca3af" }}>{p.month[0]}</text>;
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* Month table (collapsed) */}
            <div style={{ marginTop: 12, maxHeight: 180, overflowY: "auto", borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
              {projection.map(p => (
                <div key={p.month} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f9fafb" }}>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{p.month} {new Date().getFullYear() + (p.i < new Date().getMonth() ? 1 : 0)}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: p.balance >= 0 ? "#1e6b4a" : "#dc2626" }}>
                    {p.balance >= 0 ? "+" : "−"}{fmt(p.balance)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Row 6: Full breakdown ── */}
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>Full monthly breakdown</p>
            <div style={{ padding: "4px 16px 8px" }}>
              {[
                { label: "Monthly income", val: totalIncome, income: true },
                { label: "Savings (pay first)", val: savingsAmount, saving: true },
                { label: "Committed expenses", val: committedTotal },
                { label: "Subscriptions", val: subTotal },
                { label: "Irregular reserve", val: irregularMonthly },
                { label: "Discretionary spending", val: discretionaryTotal },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f9fafb", fontSize: "0.82rem" }}>
                  <span style={{ color: "#6b7280" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: (r as any).income || (r as any).saving ? "#1e6b4a" : "#374151" }}>
                    {(r as any).income ? "+" : "−"}{fmt(r.val)}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontWeight: 800, fontSize: "0.9rem" }}>
                <span style={{ color: "#111827" }}>NET MONTHLY BALANCE</span>
                <span style={{ color: balance >= 0 ? "#1e6b4a" : "#dc2626" }}>{balance >= 0 ? "+" : "−"}{fmt(balance)}</span>
              </div>
            </div>
          </Card>

          {firstNeg !== -1
            ? <Alert type="danger">Savings run out in <strong>{projection[firstNeg].month}</strong>. Cut spending or raise income by <strong>{fmt(Math.abs(balance))}/mo</strong> to stay solvent.</Alert>
            : balance > 0
              ? <Alert type="success">You're on track — projected balance reaches <strong>{fmt(projection[11].balance)}</strong> by year end, plus <strong>{fmt(savingsAmount)}/mo</strong> in automated savings.</Alert>
              : null}
        </>;
      })()}

      {/* ── AI Report section ── */}
      <div style={{ marginTop: 28, padding: 24, background: "linear-gradient(135deg, #f0f7f4, #eff6ff)", border: "1px solid #a8d5bc", borderRadius: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #1e6b4a, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(30,107,74,0.25)" }}>
            <SparkleIcon size={20} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "1rem", color: "#111827", marginBottom: 3 }}>AI Budget Analysis Report</p>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.55 }}>Get a personalised written analysis of your budget with specific action points — generated from your data.</p>
          </div>
        </div>

        {!pdfContent && !generating && (
          <button onClick={generatePDF}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", background: "linear-gradient(135deg, #1e6b4a, #1e6b4a)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 16px rgba(30,107,74,0.3)" }}>
            <SparkleIcon size={16} /> Generate My Budget Analysis
          </button>
        )}

        {generating && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ display: "inline-block", width: 28, height: 28, border: "3px solid #a8d5bc", borderTopColor: "#1e6b4a", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 10 }} />
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Analysing your budget…</p>
          </div>
        )}

        {pdfError && <Alert type="danger">{pdfError}</Alert>}

        {pdfContent && (
          <div>
            <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb", maxHeight: 320, overflowY: "auto", marginBottom: 14 }}>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: "0.88rem", color: "#374151", lineHeight: 1.75 }}>{pdfContent}</pre>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={printReport}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", background: "#1e6b4a", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <FileIcon size={15} /> Save / Print PDF
              </button>
              <button onClick={generatePDF}
                style={{ padding: "12px 16px", background: "white", border: "2px solid #e5e7eb", borderRadius: 12, color: "#6b7280", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      <NavButtons step={step} maxStep={STEPS.length - 1} onNext={() => { }} nextLabel="" />
    </div>,
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc", minHeight: "100vh", paddingBottom: 80 }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; height: 5px; border-radius: 3px; background: #e5e7eb; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #1e6b4a; cursor: pointer; box-shadow: 0 2px 6px rgba(30,107,74,0.3); }
        input[type=number]::-webkit-inner-spin-button { opacity: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "24px 24px 0" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.6rem", fontWeight: 900, color: "#111827", lineHeight: 1.2, margin: 0 }}>Plan your budget</h1>
              <p style={{ fontSize: "0.83rem", color: "#9ca3af", marginTop: 5 }}>Step through each section to build your full financial picture.</p>
            </div>
            {totalIncome > 0 && (
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                <p style={{ fontSize: "0.68rem", color: "#9ca3af", marginBottom: 2 }}>Monthly net</p>
                <p style={{ fontWeight: 900, fontSize: "1.1rem", color: balance >= 0 ? "#1e6b4a" : "#dc2626" }}>
                  {(balance >= 0 ? "+" : "−") + fmt(balance)}
                </p>
              </div>
            )}
          </div>

          {/* Step row — back button + dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "white", color: "#374151", cursor: "pointer", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <ArrowLeft size={14} />
              </button>
            )}
            <div style={{ display: "flex", gap: 5, alignItems: "center", overflowX: "auto", flex: 1 }}>
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <button key={s.id} onClick={() => i < step && setStep(i)}
                    style={{ display: "flex", alignItems: "center", gap: 0, cursor: i < step ? "pointer" : "default", background: "none", border: "none", padding: 0, flexShrink: 0 }}>
                    <div style={{
                      width: current ? 30 : 22, height: current ? 30 : 22,
                      borderRadius: "50%",
                      background: done ? "#1e6b4a" : current ? "#1e6b4a" : "#f3f4f6",
                      border: `2px solid ${done || current ? "#1e6b4a" : "#e5e7eb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.25s",
                      boxShadow: current ? "0 0 0 4px rgba(30,107,74,0.12)" : "none",
                    }}>
                      {done
                        ? <CheckIcon size={11} />
                        : <span style={{ fontSize: current ? "0.7rem" : "0.6rem", fontWeight: 700, color: current ? "white" : "#9ca3af" }}>{i + 1}</span>}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 16, height: 2, background: i < step ? "#1e6b4a" : "#e5e7eb", margin: "0 2px", transition: "background 0.3s", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9ca3af", flexShrink: 0, marginLeft: 4 }}>{step + 1} / {STEPS.length}</p>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#1e6b4a", borderRadius: 2, width: ((step + 1) / STEPS.length * 100) + "%", transition: "width 0.35s ease" }} />
          </div>
        </div>
      </div>

      {/* ── Step content ── */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "32px 24px" }}>
        {stepContent[step]}
      </div>

      {/* ── Sticky mini summary (only visible after step 0) ── */}
      {step > 0 && totalIncome > 0 && (
        <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 612 }}>
          <div style={{ background: "white", borderRadius: 18, padding: "14px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.11), 0 0 0 1px #f1f5f9" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[
                { label: "Income", value: fmt(totalIncome), color: "#1e6b4a" },
                { label: "Outgoings", value: fmt(totalOutgoings), color: "#dc2626" },
                { label: "Saving", value: fmt(savingsAmount), color: "#1e6b4a" },
                { label: "Balance", value: (balance >= 0 ? "+" : "−") + fmt(balance), color: balance >= 0 ? "#1e6b4a" : "#dc2626" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "0.6rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{item.label}</p>
                  <p style={{ fontWeight: 800, fontSize: "0.88rem", color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}