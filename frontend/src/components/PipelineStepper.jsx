import { FileSearch, FolderKanban, Receipt, ChevronRight } from 'lucide-react';

export default function PipelineStepper({ data }) {
  const jobsCount = data?.jobs?.length || 0;
  const companiesCount = data?.classified?.total_companies || 0;
  const projectsCount = data?.classified?.total_projects || 0;

  const steps = [
    { label: 'Jobs Scraped', count: jobsCount, icon: FileSearch, done: jobsCount > 0 },
    { label: 'Classified', count: companiesCount, icon: FolderKanban, done: companiesCount > 0 },
    { label: 'Invoiced', count: projectsCount, icon: Receipt, done: projectsCount > 0 },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              step.done
                ? 'bg-purple-900/30 border-purple-500 text-purple-300'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            <step.icon className="w-5 h-5" />
            <span className="font-medium">{step.label}</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                step.done ? 'bg-purple-500 text-white' : 'bg-slate-600 text-slate-300'
              }`}
            >
              {step.count}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-5 h-5 text-slate-500 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}
