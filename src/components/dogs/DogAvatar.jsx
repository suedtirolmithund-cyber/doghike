import { motion } from "framer-motion";

export default function DogAvatar({ dog, size = "md", showName = true, onClick }) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={onClick}
    >
      <div className={`${sizes[size]} rounded-full overflow-hidden border-3 border-white shadow-lg ring-2 ring-yellow-100/80`}>
        <img
          src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
          alt={dog.name}
          className="w-full h-full object-cover"
        />
      </div>
      {showName && (
        <span className={`${textSizes[size]} font-medium text-slate-700`}>{dog.name}</span>
      )}
    </motion.div>
  );
}