import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, MapPin, Briefcase, DollarSign } from 'lucide-react';
import ProjectCard from './ProjectCard';

function CompanyItem({ company, invoiceCompany }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const profile = company.client_profile || {};
  const projects = company.projects || [];
  const invoiceProjects = invoiceCompany?.projects || [];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-750 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{company.company_name}</h3>
            <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
              {profile.industry && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {profile.industry}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.location}
                </span>
              )}
              {invoiceCompany?.company_total && (
                <span className="flex items-center gap-1 text-green-400">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(invoiceCompany.company_total.min)} - {formatCurrency(invoiceCompany.company_total.max)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-slate-850 border-t border-slate-700">
          {projects.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, idx) => (
                <ProjectCard
                  key={project.project_id || idx}
                  project={project}
                  budgetEstimate={invoiceProjects[idx]?.budget_estimate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompanyList({ data }) {
  const companies = data?.classified?.companies || [];
  const invoiceCompanies = data?.invoice?.companies || [];

  if (companies.length === 0) {
    return null;
  }

  const getInvoiceCompany = (companyName) => {
    return invoiceCompanies.find((c) => c.company_name === companyName);
  };

  return (
    <div className="px-6 py-4 space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4">Companies & Projects</h2>
      {companies.map((company, idx) => (
        <CompanyItem
          key={company.company_name || idx}
          company={company}
          invoiceCompany={getInvoiceCompany(company.company_name)}
        />
      ))}
    </div>
  );
}
