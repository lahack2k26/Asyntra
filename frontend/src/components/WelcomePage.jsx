import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Zap, Brain, FileText } from 'lucide-react';

const STEPS = [
  { icon: Zap,       label: 'Scrape',   color: 'from-sky-500 to-blue-600',     border: 'border-sky-500/40',    text: 'text-sky-300' },
  { icon: Brain,     label: 'Classify', color: 'from-violet-500 to-purple-600', border: 'border-violet-500/40', text: 'text-violet-300' },
  { icon: FileText,  label: 'Invoice',  color: 'from-emerald-500 to-teal-600',  border: 'border-emerald-500/40',text: 'text-emerald-300' },
];

const ORB = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
    animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
    transition={{ duration: 7, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

export default function WelcomePage({ onGetStarted }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#080b14]">

      {/* Animated gradient orbs */}
      <ORB className="w-[600px] h-[600px] bg-violet-600 -top-40 -left-40" delay={0} />
      <ORB className="w-[500px] h-[500px] bg-blue-600 top-1/3 -right-40" delay={2.5} />
      <ORB className="w-[400px] h-[400px] bg-emerald-600 bottom-0 left-1/4" delay={5} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080b14_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl w-full">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="mb-8 flex justify-center"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-[0_0_40px_rgba(139,92,246,0.5)] border border-purple-400/20">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl font-extrabold mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Asyntra
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed mb-10"
        >
          AI-powered pipeline that scrapes freelance listings, classifies them by client, and generates budget & risk estimates — in one click.
        </motion.p>

        {/* Pipeline steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-center items-center gap-2 mb-14 flex-wrap"
        >
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/70 border ${step.border} backdrop-blur`}>
                <div className={`p-1 rounded-lg bg-gradient-to-br ${step.color}`}>
                  <step.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={`text-sm font-medium ${step.text}`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onGetStarted}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="group mx-auto flex flex-col items-center cursor-pointer"
        >
          <div className="mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-violet-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative p-5 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 border border-purple-400/30 shadow-[0_0_30px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all">
              <span className="text-3xl">👋</span>
            </div>
          </div>
          <span className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
            Hi, Admin
          </span>
          <span className="text-sm text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">
            Open your dashboard
          </span>
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 text-xs text-slate-700"
        >
          First pipeline run may take ~30s · Results cached for 30 min
        </motion.p>
      </div>
    </div>
  );
}
