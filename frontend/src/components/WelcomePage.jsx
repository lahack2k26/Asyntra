import { Briefcase, User } from 'lucide-react';

export default function WelcomePage({ onGetStarted }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-dashboard.jpeg')" }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="text-center max-w-2xl relative z-10">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-purple-600/80 rounded-2xl border border-purple-400/30">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-6">
          Asyntra
        </h1>
        
        {/* Description */}
        <p className="text-base text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
          AI-powered pipeline that scrapes freelance job listings, classifies them by company, and generates budget & timeline estimates — all in one click.
        </p>

        {/* Pipeline steps */}
        <div className="flex justify-center items-center gap-3 mb-12">
          <span className="px-4 py-1.5 bg-slate-800/80 border border-slate-600 rounded-full text-sm text-slate-300">
            Scrape
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-sm text-yellow-300">
            Classify
          </span>
          <span className="text-slate-500">→</span>
          <span className="px-4 py-1.5 bg-slate-800/80 border border-slate-600 rounded-full text-sm text-slate-300">
            Invoice
          </span>
        </div>
        
        {/* Admin Button */}
        <button 
          onClick={onGetStarted}
          className="flex flex-col items-center group cursor-pointer mx-auto"
        >
          <div className="mb-3 p-4 bg-purple-600/60 rounded-full group-hover:bg-purple-500/70 transition-colors">
            <User className="w-8 h-8 text-purple-200" />
          </div>
          <span className="text-white font-medium text-base group-hover:text-purple-300 transition-colors">
            <span className="wave-hand">👋</span> Hi, Admin
          </span>
          <p className="text-sm text-slate-500 mt-1">
            Click to open your dashboard
          </p>
        </button>

        {/* Footer note */}
        <p className="mt-16 text-xs text-slate-600">
          Hits the live pipeline on load — first run may take ~30s
        </p>
      </div>
    </div>
  );
}
