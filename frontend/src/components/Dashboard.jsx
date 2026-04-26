import { useState } from 'react';
import { Play, Loader2, AlertCircle, Inbox, Users, Building2, FileText, DollarSign, Clock, ChevronDown, ChevronUp, Home, FolderKanban, UserSearch } from 'lucide-react';
import Navbar from './Navbar';
import SummaryCards from './SummaryCards';
import CompanyList from './CompanyList';
import { getJobs } from '../api';

function Sidebar({ currentView, onNavigate, onBack }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, action: onBack },
    { id: 'pipeline', label: 'Current Projects', icon: FolderKanban, action: () => onNavigate('pipeline') },
    { id: 'leads', label: 'Leads', icon: UserSearch, action: () => onNavigate('leads') },
  ];

  return (
    <aside className="w-56 bg-slate-800 border-r border-slate-700 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white">Asyntra</h2>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              currentView === item.id || (item.id === 'home' && currentView === 'menu')
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function LeadsView({ data }) {
  const [expandedProjects, setExpandedProjects] = useState({});

  const toggleProject = (key) => {
    setExpandedProjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const companies = data?.classified?.companies || [];

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Inbox className="w-16 h-16 mb-4 text-slate-600" />
        <p className="text-lg">No leads available</p>
        <p className="text-sm text-slate-500">Run the pipeline first to discover potential projects</p>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Potential Projects</h2>
        <span className="text-sm text-slate-400">
          {companies.reduce((acc, c) => acc + (c.projects?.length || 0), 0)} projects from {companies.length} companies
        </span>
      </div>

      {companies.map((company, companyIdx) => (
        <div key={companyIdx} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {/* Company Header */}
          <div className="px-5 py-4 bg-slate-800/50 border-b border-slate-700 flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{company.company_name}</h3>
              {company.client_profile && (
                <p className="text-sm text-slate-400">
                  {company.client_profile.industry && <span>{company.client_profile.industry}</span>}
                  {company.client_profile.location && <span> • {company.client_profile.location}</span>}
                  {company.client_profile.budget_tier && <span> • {company.client_profile.budget_tier} budget</span>}
                </p>
              )}
            </div>
            <span className="ml-auto text-sm text-slate-500">{company.projects?.length || 0} projects</span>
          </div>

          {/* Projects */}
          <div className="divide-y divide-slate-700">
            {(company.projects || []).map((project, projectIdx) => {
              const key = `${companyIdx}-${projectIdx}`;
              const isExpanded = expandedProjects[key];
              const requirements = Array.isArray(project.requirements) 
                ? project.requirements 
                : typeof project.requirements === 'object' 
                  ? Object.values(project.requirements).flat()
                  : [];

              return (
                <div key={projectIdx} className="bg-slate-800/30">
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(key)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <h4 className="text-white font-medium">{project.title}</h4>
                      {project.category && (
                        <span className="text-xs text-slate-500 capitalize">{project.category}</span>
                      )}
                    </div>
                    {project.budget_estimate && (
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {project.budget_estimate.min?.toLocaleString()} - {project.budget_estimate.max?.toLocaleString()} {project.budget_estimate.currency}
                        </span>
                      </div>
                    )}
                    {project.timeline_weeks && (
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{project.timeline_weeks} weeks</span>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-2 ml-9 space-y-4">
                      {/* Requirements */}
                      {requirements.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-300 mb-2">Requirements</h5>
                          <ul className="space-y-1">
                            {requirements.map((req, i) => (
                              <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Metadata */}
                      {project.metadata && (
                        <div className="flex flex-wrap gap-2">
                          {project.metadata.complexity && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              project.metadata.complexity === 'simple' ? 'bg-green-900/30 text-green-400' :
                              project.metadata.complexity === 'moderate' ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {project.metadata.complexity} complexity
                            </span>
                          )}
                          {project.metadata.urgency && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                              {project.metadata.urgency} urgency
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6">
        {view === 'menu' && (
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
                  <span className="text-xl font-semibold text-white">Leads</span>
                  <span className="text-sm text-slate-400">View and manage leads</span>
                </button>
              </div>
            </div>
          </>
        )}

        {(view === 'pipeline' || view === 'leads') && (
          <div className="flex">
            <Sidebar currentView={view} onNavigate={handleNavigate} onBack={onBack} />
            
            <div className="flex-1 p-6">
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
                      <SummaryCards data={data} />
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
      </main>
    </div>
  );
}
