import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, unit, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-stone-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-light text-stone-800">{value}</span>
        {unit && <span className="text-sm text-stone-400">{unit}</span>}
      </div>
    </motion.div>
  );
}