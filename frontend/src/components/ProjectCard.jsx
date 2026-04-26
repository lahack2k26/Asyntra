import { Clock, Gauge, DollarSign, Code } from 'lucide-react';

export default function ProjectCard({ project, budgetEstimate }) {
  const complexity = project?.metadata?.complexity || 'N/A';
  const urgency = project?.metadata?.urgency || 'N/A';
  const techReqs = project?.technical_requirements || {};

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const complexityColor = {
    low: 'text-green-400 bg-green-900/30',
    medium: 'text-yellow-400 bg-yellow-900/30',
    high: 'text-red-400 bg-red-900/30',
  };

  const urgencyColor = {
    low: 'text-blue-400 bg-blue-900/30',
    medium: 'text-orange-400 bg-orange-900/30',
    high: 'text-red-400 bg-red-900/30',
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
      <h4 className="text-white font-semibold mb-3 line-clamp-2">{project.title}</h4>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${complexityColor[complexity?.toLowerCase()] || 'text-slate-400 bg-slate-700'}`}>
          <Gauge className="w-3 h-3" />
          {complexity}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${urgencyColor[urgency?.toLowerCase()] || 'text-slate-400 bg-slate-700'}`}>
          <Clock className="w-3 h-3" />
          {urgency}
        </span>
      </div>

      {budgetEstimate && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-slate-300">
            {formatCurrency(budgetEstimate.min)} - {formatCurrency(budgetEstimate.max)}
          </span>
        </div>
      )}

      {Object.keys(techReqs).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <Code className="w-3 h-3" />
            <span>Technical Requirements</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(techReqs).slice(0, 5).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                title={`${key}: ${JSON.stringify(value)}`}
              >
                {key}
              </span>
            ))}
            {Object.keys(techReqs).length > 5 && (
              <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                +{Object.keys(techReqs).length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
