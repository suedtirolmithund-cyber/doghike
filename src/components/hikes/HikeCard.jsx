import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ExpandableText from "@/components/ExpandableText";
import WaterIcon from "@/components/icons/WaterIcon";
import { TOUR_ICONS, getDifficultyBadgeClass, getDifficultyLabel, getSeasonIcon, getWaterBadgeClass, getWaterLabel } from "@/lib/difficultyConfig";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";

export default function HikeCard({ hike, dogs = [], index = 0 }) {
  const hikeDogs = dogs.filter((dog) => hike.dogs?.includes(dog.id));
  const coverPhoto = hike.photos?.[0];
  const hikeSource = hike._source ?? "sheets";
  const detailId = hikeSource === "sheets" && hike._public_hike_id ? hike.route_id || String(hike._public_hike_id) : hike.id;
  const dogDifficultyLabel = getDifficultyLabel(hike.dog_difficulty);
  const humanDifficultyLabel = getDifficultyLabel(hike.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.42 }}
    >
      <Link to={createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=${hikeSource}`}>
        <div className="group overflow-hidden rounded-[22px] border border-brand-100/80 bg-white/78 shadow-[0_12px_28px_rgba(192,48,96,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(232,88,32,0.12)]">
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#d7c0ad] via-[#c8b49f] to-[#8fa19a] sm:h-52">
            {coverPhoto && (
              <img
                src={coverPhoto}
                alt={hike.trail_name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />

            {PREMIUM_FEATURES_ENABLED && hike.is_premium && (
              <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/74 px-2.5 py-1 text-xs font-semibold text-[#741c3b] shadow-sm backdrop-blur-sm">
                Premium
              </span>
            )}

            {hike.season && (
              <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/74 text-xl shadow-sm backdrop-blur-sm">
                {getSeasonIcon(hike.season)}
              </span>
            )}

            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="mb-1 text-xl font-semibold leading-tight text-white drop-shadow-sm">{hike.trail_name}</h3>
              <div className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                <span>{TOUR_ICONS.location}</span>
                <span>{hike.location || "Dolomites"}</span>
              </div>
              {Array.isArray(hike.tags) && hike.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {hike.tags.slice(0, 3).map((tag, tagIndex) => (
                    <div key={tag} className="flex items-center gap-1.5">
                      {tagIndex > 0 && <span className="text-white/65">•</span>}
                      <span className="text-[12px] font-medium tracking-wide text-white/92 drop-shadow-sm">
                        {tag}
                      </span>
                    </div>
                  ))}
                  {hike.tags.length > 3 && (
                    <span className="text-[12px] font-medium text-white/78 drop-shadow-sm">
                      +{hike.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {humanDifficultyLabel && (
                <Badge className={`${getDifficultyBadgeClass(hike.difficulty)} border px-2.5 py-1 text-xs font-medium`}>
                  {TOUR_ICONS.human} {humanDifficultyLabel}
                </Badge>
              )}
              {dogDifficultyLabel && (
                <Badge className={`${getDifficultyBadgeClass(hike.dog_difficulty)} border px-2.5 py-1 text-xs font-medium`}>
                  {TOUR_ICONS.dog} {dogDifficultyLabel}
                </Badge>
              )}
              {hike.water_availability && (
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getWaterBadgeClass(hike.water_availability)}`}>
                  <WaterIcon value={hike.water_availability} /> {getWaterLabel(hike.water_availability) ?? hike.water_availability}
                </span>
              )}
            </div>
            {hike.notes && (
              <div className="mb-3">
                <ExpandableText
                  text={hike.notes}
                  lines={6}
                  className="text-sm leading-relaxed text-slate-600"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {hike._source === "journal" ? (
                  <div className="flex min-w-0 items-center gap-2">
                    {(hike.dog_photo_url || hike.author_avatar) && (
                      <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-brand-100/80 shadow-sm">
                        <img
                          src={hike.dog_photo_url || hike.author_avatar}
                          alt={hike.dog_name || hike.author_username || ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {(hike.dog_name || hike.author_username) && (
                      <span className="truncate text-xs text-slate-500">
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
                        className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-brand-100/80 shadow-sm"
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
                      <span className="ml-1 truncate text-sm text-slate-500">
                        {hikeDogs.map((dog) => dog.name).join(", ")}
                      </span>
                    )}
                  </>
                )}
              </div>

              {hike.rating && (
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-4 w-4 fill-[#c03060] text-[#c03060]" />
                  <span className="text-sm font-medium text-slate-700">{hike.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
