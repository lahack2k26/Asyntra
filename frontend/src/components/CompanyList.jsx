import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, ChevronDown, ChevronUp, DollarSign, TrendingUp, AlertTriangle, Layers } from 'lucide-react';
import ProjectCard from './ProjectCard';

const RANK_STYLES = [
  'from-yellow-500 to-amber-600 text-white',
  'from-slate-300 to-slate-400 text-slate-900',
  'from-amber-700 to-orange-800 text-white',
  'from-violet-500 to-purple-600 text-white',
  'from-sky-500 to-blue-600 text-white',
];

const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

function RiskPip({ score }) {
  if (!score) return null;
  const color = score >= 7 ? 'bg-red-500' : score >= 4 ? 'bg-yellow-500' : 'bg-green-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`Risk ${score}/10`} />;
}

function CompanyItem({ company, invoiceCompany, rank }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const profile = company.client_profile || {};
  const projects = company.projects || [];
  const invoiceProjects = invoiceCompany?.projects || [];
  const total = invoiceCompany?.company_total;
  const avgRisk = invoiceProjects.length
    ? Math.round(invoiceProjects.reduce((s, p) => s + (p?.risk_assessment?.overall_risk_score || 0), 0) / invoiceProjects.length * 10) / 10
    : null;

  return (
    <motion.div layout className="rounded-xl border border-slate-700/60 bg-slate-800/50 backdrop-blur overflow-hidden hover:border-slate-600 transition-colors">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${RANK_STYLES[rank] || RANK_STYLES[4]} flex items-center justify-center text-xs font-bold shadow`}>
            #{rank + 1}
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm truncate">{company.company_name}</span>
              {avgRisk !== null && <RiskPip score={avgRisk} />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {profile.location && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{profile.location}
                </span>
              )}
              {profile.industry && (
                <span className="text-xs text-slate-500 truncate">{profile.industry}</span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {total && (
              <span className="text-xs font-semibold text-emerald-400">
                {fmt(total.min)}–{fmt(total.max)}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              {projects.length}p
            </span>
            {isExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-500" />
              : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-700/50 space-y-2">
              {projects.map((project, idx) => (
                <ProjectCard
                  key={project.project_id || idx}
                  project={project}
                  invoiceData={invoiceProjects[idx]}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CompanyList({ data }) {
  const [showAll, setShowAll] = useState(false);
  const companies = data?.classified?.companies || [];
  const invoiceCompanies = data?.invoice?.companies || [];

  if (companies.length === 0) return null;

  const getInvoiceCompany = (name) => invoiceCompanies.find((c) => c.company_name === name);

  const sorted = [...companies].sort((a, b) => {
    const aInv = getInvoiceCompany(a.company_name);
    const bInv = getInvoiceCompany(b.company_name);
    return (bInv?.company_total?.max || 0) - (aInv?.company_total?.max || 0);
  });

  const CURATED_COUNT = 5;
  const displayed = showAll ? sorted : sorted.slice(0, CURATED_COUNT);
  const hidden = sorted.length - CURATED_COUNT;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Top Opportunities</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{companies.length} companies · ranked by budget</span>
          {hidden > 0 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              {showAll ? `Show top ${CURATED_COUNT}` : `+${hidden} more`}
              {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {displayed.map((company, idx) => (
          <motion.div
            key={company.company_name || idx}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          >
            <CompanyItem
              company={company}
              invoiceCompany={getInvoiceCompany(company.company_name)}
              rank={idx}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
