import { DollarSign, Timer, AlertTriangle, Zap } from 'lucide-react';

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const COMPLEXITY = {
  simple:   'text-green-400  bg-green-900/20  border-green-800/40',
  moderate: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40',
  complex:  'text-red-400    bg-red-900/20    border-red-800/40',
};
const URGENCY = {
  low:    'text-sky-400    bg-sky-900/20    border-sky-800/40',
  medium: 'text-orange-400 bg-orange-900/20 border-orange-800/40',
  high:   'text-red-400    bg-red-900/20    border-red-800/40',
};
const riskColor = (s) => s >= 7 ? 'text-red-400' : s >= 4 ? 'text-yellow-400' : 'text-green-400';

export default function ProjectCard({ project, invoiceData }) {
  const complexity = project?.metadata?.complexity?.toLowerCase();
  const urgency    = project?.metadata?.urgency?.toLowerCase();
  const techReqs   = project?.technical_requirements || {};

  const budget  = invoiceData?.budget_estimate;
  const workload = invoiceData?.workload_metrics;
  const risk    = invoiceData?.risk_assessment;

  const allTech = Object.values(techReqs).flat().filter(Boolean).slice(0, 6);

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 hover:border-violet-500/30 transition-colors">

      {/* Title + badges row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-white text-sm font-semibold leading-snug flex-1">{project.title}</h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {complexity && (
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${COMPLEXITY[complexity] || 'text-slate-400 bg-slate-700 border-slate-600'}`}>
              {complexity}
            </span>
          )}
          {urgency && (
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${URGENCY[urgency] || 'text-slate-400 bg-slate-700 border-slate-600'}`}>
              <Zap className="inline w-2.5 h-2.5 mr-0.5" />{urgency}
            </span>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        {budget && (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <DollarSign className="w-3 h-3" />
            {fmt(budget.min)}–{fmt(budget.max)}
          </span>
        )}
        {workload && (
          <span className="flex items-center gap-1 text-sky-400">
            <Timer className="w-3 h-3" />
            {workload.estimated_hours_min}–{workload.estimated_hours_max} hrs
            <span className="text-slate-600">· {workload.weeks_at_40hrs_min}–{workload.weeks_at_40hrs_max} wks</span>
          </span>
        )}
        {risk?.overall_risk_score > 0 && (
          <span className={`flex items-center gap-1 font-semibold ${riskColor(risk.overall_risk_score)}`}>
            <AlertTriangle className="w-3 h-3" />
            {risk.overall_risk_score}/10
          </span>
        )}
      </div>

      {/* Risk note */}
      {risk?.risk_factors?.[0] && (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1 italic">{risk.risk_factors[0]}</p>
      )}

      {/* Tech chips */}
      {allTech.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {allTech.map((t, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-400 border border-slate-600/50">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
