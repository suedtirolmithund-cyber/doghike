import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, unit, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="doghike-glass-card-hover p-5 md:p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl bg-gradient-to-br from-[#fada6a] to-[#c03060] p-2.5 shadow-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-light text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
    </motion.div>
  );
}
