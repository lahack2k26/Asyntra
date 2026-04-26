import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FolderGit2, Clock, AlertTriangle, DollarSign, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { refreshInvoices } from '../api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

const STAT_COLORS = {
  blue:    'bg-blue-900/30 border-blue-500/40 text-blue-400',
  green:   'bg-green-900/30 border-green-500/40 text-green-400',
  emerald: 'bg-emerald-900/30 border-emerald-500/40 text-emerald-400',
  sky:     'bg-sky-900/30 border-sky-500/40 text-sky-400',
};

function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const duration = 900;
    const from = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return display;
}

function StatCard({ icon, label, value, sub, color, animate: doAnimate, numericTarget }) {
  return (
    <motion.div variants={fadeUp} className={`rounded-xl border p-3.5 ${STAT_COLORS[color]} hover:brightness-110 transition-all cursor-default`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-80">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-white leading-tight">
        {doAnimate && numericTarget != null ? <AnimatedNumber target={numericTarget} /> : value}
      </p>
      {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
    </motion.div>
  );
}

function RiskBadge({ score }) {
  if (score == null || score === 0) return null;
  const color = score >= 7 ? 'text-red-400 bg-red-900/30 border-red-500/50'
    : score >= 4 ? 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50'
    : 'text-green-400 bg-green-900/30 border-green-500/50';
  const label = score >= 7 ? 'High Risk' : score >= 4 ? 'Medium Risk' : 'Low Risk';
  return <span className={`text-xs font-medium px-2 py-0.5 rounded border ${color}`}>{label}</span>;
}

export default function SummaryCards({ data, onInvoiceRefreshed }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [showHighRisk, setShowHighRisk] = useState(false);

  const totalCompanies = data?.classified?.total_companies || 0;
  const totalProjects = data?.classified?.total_projects || 0;
  const summary = data?.invoice?.summary || {};

  const budgetMin = summary.accumulated_budget_min || 0;
  const budgetMax = summary.accumulated_budget_max || 0;
  const hoursMin = summary.total_hours_min || 0;
  const hoursMax = summary.total_hours_max || 0;
  const weeksMin = summary.total_weeks_at_40hrs_min || 0;
  const weeksMax = summary.total_weeks_at_40hrs_max || 0;
  const avgRisk = summary.average_risk_score || 0;
  const highRiskProjects = summary.high_risk_projects || [];

  const allCommitments = (data?.invoice?.companies || [])
    .flatMap(c => c.projects || [])
    .map(p => p.workload_metrics?.recommended_weekly_commitment)
    .filter(Boolean);

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await refreshInvoices();
      if (onInvoiceRefreshed) onInvoiceRefreshed(result.invoice);
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Unknown error';
      setRefreshError(`Refresh failed: ${detail}`);
    } finally {
      setRefreshing(false);
    }
  };

  const hasWorkloadData = hoursMax > 0;

  return (
    <div className="mb-6 space-y-3">
      {/* Stat strip */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Building2 className="w-4 h-4" />} label="Companies" value={totalCompanies} color="blue" animate numericTarget={totalCompanies} />
        <StatCard icon={<FolderGit2 className="w-4 h-4" />} label="Projects" value={totalProjects} color="green" animate numericTarget={totalProjects} />
        {budgetMax > 0 && totalProjects > 0 && (
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Avg per Project"
            value={`${formatCurrency(Math.round(budgetMin / totalProjects))}–${formatCurrency(Math.round(budgetMax / totalProjects))}`}
            sub={`Total: ${formatCurrency(budgetMin)}–${formatCurrency(budgetMax)}`}
            color="emerald"
          />
        )}
        {hasWorkloadData && (
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Total Workload"
            value={`${hoursMin}–${hoursMax} hrs`}
            sub={`${weeksMin}–${weeksMax} wks @ 40hr/wk`}
            color="sky"
          />
        )}
      </motion.div>

      {/* Action bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center justify-between gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          {avgRisk > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-slate-300">
                  Project Risk Score <span className="font-bold text-white">{avgRisk}/10</span>
                </span>
                <span className="group relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
                  <span className="pointer-events-none absolute left-5 -top-1 w-56 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                    AI-generated on a 0–10 scale. Factors: unclear requirements, technical complexity, tight deadlines, niche tech. 7+ = high risk.
                  </span>
                </span>
              </div>
              <RiskBadge score={avgRisk} />
              {highRiskProjects.length > 0 && (
                <button
                  onClick={() => setShowHighRisk(v => !v)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-red-800/40 rounded px-1.5 py-0.5"
                >
                  {highRiskProjects.length} need review
                  {showHighRisk ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-500">Refresh invoices to generate workload & risk scores</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-medium hover:bg-violet-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Regenerating…' : 'Refresh Invoices'}
          </button>
          {refreshError && <p className="text-xs text-red-400">{refreshError}</p>}
          {refreshing && <p className="text-xs text-violet-400/60">~30s for new data…</p>}
        </div>
      </motion.div>

      {/* High-risk dropdown */}
      <AnimatePresence>
      {showHighRisk && highRiskProjects.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
        <div className="bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">High Risk Projects</p>
          {highRiskProjects.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-red-500 font-bold mt-0.5">{p.risk_score}/10</span>
              <div>
                <span className="text-red-300 font-medium">{p.title}</span>
                {p.top_risk && <p className="text-red-400/60 mt-0.5">{p.top_risk}</p>}
              </div>
            </div>
          ))}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
