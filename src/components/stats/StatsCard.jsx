import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, unit, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="doghike-glass-card-hover p-2.5 sm:p-4 md:p-5"
    >
      <div className="flex min-h-[58px] flex-col items-center justify-center gap-1.5 sm:min-h-0 sm:flex-row sm:justify-start sm:gap-2.5">
        <div className="rounded-lg bg-gradient-to-br from-[#F9C030] to-[#A8003C] p-1.5 shadow-sm sm:rounded-xl sm:p-2">
          <Icon className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4 md:h-5 md:w-5" />
        </div>
        <div className="flex min-w-0 flex-col items-center gap-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5 sm:gap-y-0.5">
          <span className="text-xl font-bold leading-none text-[#7C3020] sm:text-2xl">{value}</span>
          <span className="min-w-0 text-center text-[9px] font-semibold uppercase leading-tight text-[#C07820] sm:text-left sm:text-xs md:text-sm">
            {label}
          </span>
          {unit && <span className="text-xs text-[#C07820]/75 md:text-sm">{unit}</span>}
        </div>
      </div>
      {description && (
        <p className="mt-2 text-sm text-[#C07820]">{description}</p>
      )}
    </motion.div>
  );
}
