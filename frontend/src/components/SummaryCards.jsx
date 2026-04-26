import { Building2, FolderGit2 } from 'lucide-react';

export default function SummaryCards({ data }) {
  const totalCompanies = data?.classified?.total_companies || 0;
  const totalProjects = data?.classified?.total_projects || 0;

  const cards = [
    { label: 'Total Companies', value: totalCompanies, icon: Building2, color: 'blue' },
    { label: 'Total Projects', value: totalProjects, icon: FolderGit2, color: 'green' },
  ];

  const colorClasses = {
    blue: 'bg-blue-900/30 border-blue-500/50 text-blue-400',
    green: 'bg-green-900/30 border-green-500/50 text-green-400',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${colorClasses[card.color]}`}
        >
          <div className="flex items-center gap-3">
            <card.icon className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-80">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
