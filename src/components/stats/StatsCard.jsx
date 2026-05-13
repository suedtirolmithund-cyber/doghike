import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, unit, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="doghike-glass-card-hover p-4 md:p-5"
    >
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl bg-gradient-to-br from-[#F9C030] to-[#A8003C] p-2 shadow-sm">
          <Icon className="h-4 w-4 text-white md:h-5 md:w-5" />
        </div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-2xl font-light leading-none text-slate-900 md:text-3xl">{value}</span>
          <span className="min-w-0 whitespace-normal break-words text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 sm:text-xs md:text-sm">
            {label}
          </span>
          {unit && <span className="text-xs text-slate-400 md:text-sm">{unit}</span>}
        </div>
      </div>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </motion.div>
  );
}
