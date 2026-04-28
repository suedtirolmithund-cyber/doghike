import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ExpandableText from "@/components/ExpandableText";
import { getDifficultyBadgeClass, getDifficultyLabel } from "@/lib/difficultyConfig";

const seasonEmojis = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
  all_year: "🍃",
};

const waterLabels = {
  none: "Kein Wasser",
  little: "Wenig Wasser",
  moderate: "Etwas Wasser",
  plenty: "Viel Wasser",
};

const waterClasses = {
  none: "text-[#9f4f39] bg-[#f4ded6] border-[#e7c6bb]",
  little: "text-[#9a6c58] bg-[#f3e7dc] border-[#e4d0c0]",
  moderate: "text-[#6f7f86] bg-[#e7eef0] border-[#cfdee2]",
  plenty: "text-[#4f7280] bg-[#dce9ed] border-[#bfd4dc]",
};

function StatTile({ value, label }) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-stone-200/70 bg-white/58 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
      <p className="text-base font-semibold leading-none text-[#8c5f43]">{value}</p>
      <p className="mt-1 text-[11px] text-stone-500">{label}</p>
    </div>
  );
}

export default function HikeCard({ hike, dogs = [], index = 0 }) {
  const hikeDogs = dogs.filter((dog) => hike.dogs?.includes(dog.id));
  const coverPhoto = hike.photos?.[0];
  const hikeSource = hike._source ?? "sheets";
  const dogDifficultyLabel = getDifficultyLabel(hike.dog_difficulty);
  const humanDifficultyLabel = getDifficultyLabel(hike.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.42 }}
    >
      <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}&source=${hikeSource}`}>
        <div className="group overflow-hidden rounded-2xl border border-stone-200/75 bg-white/72 shadow-[0_12px_30px_rgba(142,78,54,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(142,78,54,0.13)]">
          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#d7c0ad] via-[#c8b49f] to-[#8fa19a]">
            {coverPhoto && (
              <img
                src={coverPhoto}
                alt={hike.trail_name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-stone-950/8 to-transparent" />

            {hike.is_premium && (
              <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/72 px-2.5 py-1 text-xs font-semibold text-[#8c5f43] shadow-sm backdrop-blur-sm">
                Premium
              </span>
            )}

            {hike.season && (
              <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/72 text-xl shadow-sm backdrop-blur-sm">
                {seasonEmojis[hike.season]}
              </span>
            )}

            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="mb-1 text-xl font-semibold text-white">{hike.trail_name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-white/85">
                <MapPin className="h-3.5 w-3.5" />
                <span>{hike.location || "Dolomites"}</span>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {humanDifficultyLabel && (
                <Badge className={`${getDifficultyBadgeClass(hike.difficulty)} border px-2.5 py-0.5 text-xs font-medium`}>
                  👤 {humanDifficultyLabel}
                </Badge>
              )}
              {dogDifficultyLabel && (
                <Badge className={`${getDifficultyBadgeClass(hike.dog_difficulty)} border px-2.5 py-0.5 text-xs font-medium`}>
                  🐕 {dogDifficultyLabel}
                </Badge>
              )}
              {hike.water_availability && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${waterClasses[hike.water_availability] ?? waterClasses.moderate}`}>
                  {waterLabels[hike.water_availability] ?? hike.water_availability}
                </span>
              )}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatTile value={hike.distance_km} label="km" />
              <StatTile value={hike.elevation_gain_m} label="Hm" />
              <StatTile
                value={hike.duration_minutes ? (hike.duration_minutes / 60).toFixed(1) : null}
                label="Std"
              />
            </div>

            {hike.notes && (
              <div className="mb-3">
                <ExpandableText
                  text={hike.notes}
                  lines={3}
                  className="text-sm leading-relaxed text-stone-600"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {hike._source === "journal" ? (
                  <div className="flex min-w-0 items-center gap-2">
                    {(hike.dog_photo_url || hike.author_avatar) && (
                      <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-stone-100 shadow-sm">
                        <img
                          src={hike.dog_photo_url || hike.author_avatar}
                          alt={hike.dog_name || hike.author_username || ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {(hike.dog_name || hike.author_username) && (
                      <span className="truncate text-xs text-stone-500">
                        {hike.dog_name && <span>{hike.dog_name}</span>}
                        {hike.dog_name && hike.author_username && " · "}
                        {hike.author_username && <span>@{hike.author_username}</span>}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    {hikeDogs.slice(0, 3).map((dog, dogIndex) => (
                      <div
                        key={dog.id}
                        className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-stone-100 shadow-sm"
                        style={{ marginLeft: dogIndex > 0 ? "-8px" : 0 }}
                      >
                        <img
                          src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                          alt={dog.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {hikeDogs.length > 0 && (
                      <span className="ml-1 truncate text-sm text-stone-500">
                        {hikeDogs.map((dog) => dog.name).join(", ")}
                      </span>
                    )}
                  </>
                )}
              </div>

              {hike.rating && (
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-4 w-4 fill-[#b8785f] text-[#b8785f]" />
                  <span className="text-sm font-medium text-stone-700">{hike.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
