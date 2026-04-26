import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, AlertCircle, Inbox, Users, Building2, FileText, DollarSign, Clock, ChevronDown, ChevronUp, Home, FolderKanban, UserSearch } from 'lucide-react';
import Navbar from './Navbar';
import SummaryCards from './SummaryCards';
import CompanyList from './CompanyList';
import { getJobs } from '../api';

function Sidebar({ currentView, onNavigate, onBack }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, action: onBack },
    { id: 'pipeline', label: 'Current Projects', icon: FolderKanban, action: () => onNavigate('pipeline') },
    { id: 'leads', label: 'Prospects', icon: UserSearch, action: () => onNavigate('leads') },
  ];

  return (
    <aside className="w-44 bg-slate-800/80 border-r border-slate-700/60 min-h-screen py-6 px-3 flex flex-col gap-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          title={item.label}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
            currentView === item.id || (item.id === 'home' && currentView === 'menu')
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-500 hover:bg-slate-700/60 hover:text-slate-200'
          }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium truncate">{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

const COMPANY_ACCENTS = [
  { border: 'border-t-violet-500', icon: 'bg-violet-900/40 text-violet-400', badge: 'bg-violet-900/30 text-violet-300' },
  { border: 'border-t-sky-500',    icon: 'bg-sky-900/40 text-sky-400',       badge: 'bg-sky-900/30 text-sky-300' },
  { border: 'border-t-emerald-500',icon: 'bg-emerald-900/40 text-emerald-400',badge: 'bg-emerald-900/30 text-emerald-300' },
  { border: 'border-t-rose-500',   icon: 'bg-rose-900/40 text-rose-400',      badge: 'bg-rose-900/30 text-rose-300' },
  { border: 'border-t-amber-500',  icon: 'bg-amber-900/40 text-amber-400',    badge: 'bg-amber-900/30 text-amber-300' },
];

function LeadsView({ data }) {
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProject = (key) => {
    setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const companies = data?.classified?.companies || [];
  const invoiceCompanies = data?.invoice?.companies || [];

  const getInvoiceProject = (companyName, projectIdx) => {
    const ic = invoiceCompanies.find(c => c.company_name === companyName);
    return ic?.projects?.[projectIdx] || null;
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Inbox className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg">No prospects yet</p>
        <p className="text-sm text-slate-500">Run the pipeline first to discover potential projects</p>
      </div>
    );
  }

  const totalProjects = companies.reduce((acc, c) => acc + (c.projects?.length || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Prospects</h2>
        <span className="text-sm text-slate-400">{totalProjects} projects · {companies.length} companies</span>
      </div>

      {/* 2-column company grid */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-2 gap-5"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {companies.map((company, companyIdx) => {
          const accent = COMPANY_ACCENTS[companyIdx % COMPANY_ACCENTS.length];
          const profile = company.client_profile || {};

          return (
            <motion.div
              key={companyIdx}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              className={`rounded-2xl border-t-4 ${accent.border} bg-slate-800/60 backdrop-blur border border-slate-700/60 shadow-xl overflow-hidden`}
            >
              {/* Company header */}
              <div className="px-5 pt-4 pb-3 flex items-start gap-3">
                <div className={`p-2 rounded-xl ${accent.icon}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white leading-tight">{company.company_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {[profile.industry, profile.location, profile.budget_tier && `${profile.budget_tier} budget`]
                      .filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${accent.badge} whitespace-nowrap`}>
                  {company.projects?.length || 0} project{company.projects?.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-700/60 mx-4" />

              {/* Projects */}
              <div className="p-3 space-y-2">
                {(company.projects || []).map((project, projectIdx) => {
                  const key = `${companyIdx}-${projectIdx}`;
                  const isExpanded = expandedProjects[key];
                  const invoice = getInvoiceProject(company.company_name, projectIdx);
                  const budget = invoice?.budget_estimate;
                  const workload = invoice?.workload_metrics;
                  const risk = invoice?.risk_assessment;
                  const requirements = Array.isArray(project.requirements)
                    ? project.requirements
                    : typeof project.requirements === 'object'
                      ? Object.values(project.requirements).flat()
                      : [];
                  const complexity = project.metadata?.complexity;
                  const urgency = project.metadata?.urgency;
                  const riskScore = risk?.overall_risk_score;

                  return (
                    <div key={projectIdx} className="rounded-xl bg-slate-900/60 border border-slate-700/50 overflow-hidden">
                      {/* Project row */}
                      <button
                        onClick={() => toggleProject(key)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700/30 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-snug">{project.title}</p>
                          {project.category && (
                            <p className="text-xs text-slate-500 capitalize mt-0.5">{project.category}</p>
                          )}
                          {/* Inline metrics row */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {budget && (
                              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(budget.min)} – {formatCurrency(budget.max)}
                              </span>
                            )}
                            {workload && (
                              <span className="flex items-center gap-1 text-xs text-sky-400">
                                <Clock className="w-3 h-3" />
                                {workload.weeks_at_40hrs_min}–{workload.weeks_at_40hrs_max} wks
                              </span>
                            )}
                            {riskScore != null && (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                riskScore >= 7 ? 'bg-red-900/40 text-red-400' :
                                riskScore >= 4 ? 'bg-yellow-900/40 text-yellow-400' :
                                'bg-green-900/40 text-green-400'
                              }`}>
                                Risk {riskScore}/10
                              </span>
                            )}
                            {complexity && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                complexity === 'simple' ? 'bg-green-900/30 text-green-400' :
                                complexity === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-red-900/30 text-red-400'
                              }`}>{complexity}</span>
                            )}
                            {urgency && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{urgency} urgency</span>
                            )}
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                          : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
                      </button>

                      {/* Expanded details */}
                      <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="detail"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                        <div className="px-4 pb-4 pt-1 border-t border-slate-700/50 space-y-3">
                          {requirements.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Requirements</p>
                              <ul className="space-y-1">
                                {requirements.map((req, i) => (
                                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                    <span className="text-purple-400 mt-0.5 flex-shrink-0">›</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {risk?.risk_factors?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Risk Factors</p>
                              <ul className="space-y-1">
                                {risk.risk_factors.map((r, i) => (
                                  <li key={i} className="text-xs text-red-400/80 flex items-start gap-2">
                                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {workload?.recommended_weekly_commitment && (
                            <p className="text-xs text-sky-400/80 italic">{workload.recommended_weekly_commitment}</p>
                          )}
                        </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Dashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('menu'); // 'menu' | 'pipeline' | 'leads'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getJobs();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    setView('pipeline');
    await fetchData();
  };

  const handleLeads = async () => {
    setView('leads');
    if (!data) {
      await fetchData();
    }
  };

  const handleNavigate = async (newView) => {
    setView(newView);
    if (!data) {
      await fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />

      {view === 'menu' && (
        <main className="max-w-4xl mx-auto py-6 w-full">
          <>
            {onBack && (
              <div className="px-6 mb-4">
                <button
                  onClick={onBack}
                  className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
                >
                  ← Back to Home
                </button>
              </div>
            )}
            <div className="flex flex-col items-center justify-center py-20">
              <h2 className="text-3xl font-bold text-white mb-8">What would you like to do?</h2>
              <div className="flex gap-6">
                <button
                  onClick={handleRunPipeline}
                  className="flex flex-col items-center gap-4 p-8 bg-slate-800 border border-slate-700 hover:border-purple-500 rounded-xl transition-all hover:scale-105 group"
                >
                  <div className="p-4 bg-purple-900/30 rounded-full group-hover:bg-purple-900/50 transition-colors">
                    <Play className="w-10 h-10 text-purple-400" />
                  </div>
                  <span className="text-xl font-semibold text-white">Current Projects</span>
                  <span className="text-sm text-slate-400">View active projects</span>
                </button>

                <button
                  onClick={handleLeads}
                  className="flex flex-col items-center gap-4 p-8 bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all hover:scale-105 group"
                >
                  <div className="p-4 bg-blue-900/30 rounded-full group-hover:bg-blue-900/50 transition-colors">
                    <Users className="w-10 h-10 text-blue-400" />
                  </div>
                  <span className="text-xl font-semibold text-white">Prospects</span>
                  <span className="text-sm text-slate-400">Browse potential clients</span>
                </button>
              </div>
            </div>
          </>
        </main>
      )}

      {(view === 'pipeline' || view === 'leads') && (
        <div className="flex flex-1">
          <Sidebar currentView={view} onNavigate={handleNavigate} onBack={onBack} />
          
          <div className="flex-1 p-6 overflow-y-auto">
              {view === 'pipeline' && (
                <>
                  {/* Error State */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-300">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Loader2 className="w-12 h-12 animate-spin mb-4" />
                      <p className="text-lg">Loading projects, please wait...</p>
                      <p className="text-sm text-slate-500">This may take a few moments</p>
                    </div>
                  )}

                  {/* Empty State */}
                  {!loading && !data && !error && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Inbox className="w-16 h-16 mb-4 text-slate-600" />
                      <p className="text-lg">No data yet</p>
                    </div>
                  )}

                  {/* Data Display */}
                  {!loading && data && (
                    <>
                      <SummaryCards
                        data={data}
                        onInvoiceRefreshed={(invoice) => setData(prev => ({ ...prev, invoice }))}
                      />
                      <CompanyList data={data} />
                    </>
                  )}
                </>
              )}

              {view === 'leads' && (
                <>
                  {/* Error State */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-300">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Loading State */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Loader2 className="w-12 h-12 animate-spin mb-4" />
                      <p className="text-lg">Loading leads...</p>
                      <p className="text-sm text-slate-500">Fetching potential projects</p>
                    </div>
                  )}

                  {/* Leads Display */}
                  {!loading && <LeadsView data={data} />}
                </>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
