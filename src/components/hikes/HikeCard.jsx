import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ExpandableText from "@/components/ExpandableText";
import WaterIcon from "@/components/icons/WaterIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import DifficultyScaleChip from "@/components/difficulty/DifficultyScale";
import { PremiumPawBadge } from "@/components/premium/PremiumPawBadge";
import { HIKE_CARD_STAT_CHIP_CLASS, TOUR_ICONS, getDifficultyLabel, getSeasonBadgeClass, getSeasonIcon, getWaterBadgeClass, getWaterLabel, normalizeSeasonValues } from "@/lib/difficultyConfig";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";
import { getAvatarDataUrl, HIKE_PLACEHOLDER_IMAGE } from "@/lib/fallbackImages";
import { formatDurationHours } from "@/lib/duration";
import { getDisplayImageUrl } from "@/lib/imageProxy";
import { getUniqueHikeImageSources, resolveHikeImageUrl } from "@/lib/hikeImages";

const METRIC_FORMATTER = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

function hasMetricValue(value) {
  if (value === null || value === undefined || value === "") return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

function formatDistance(value) {
  return `${METRIC_FORMATTER.format(Number(value))} km`;
}

function formatElevation(value) {
  return `${METRIC_FORMATTER.format(Number(value))} Hm`;
}

export default function HikeCard({
  hike,
  dogs = [],
  index = 0,
  waterInStatsRow = false,
  imageSize = "default",
  descriptionLines = 6,
}) {
  const hikeDogs = dogs.filter((dog) => hike.dogs?.includes(dog.id));
  const cardPhotoSource = useMemo(() => {
    return getUniqueHikeImageSources(
      hike.image,
      Array.isArray(hike.photos) ? hike.photos : [],
      Array.isArray(hike._photo_references) ? hike._photo_references : []
    );
  }, [hike._photo_references, hike.image, hike.photos]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(0);
  const coverPhotosKey = useMemo(() => cardPhotoSource.join("|"), [cardPhotoSource]);
  const currentCoverPhoto =
    coverPhotoIndex >= 0 ? cardPhotoSource[coverPhotoIndex] || HIKE_PLACEHOLDER_IMAGE : HIKE_PLACEHOLDER_IMAGE;
  const resolvedCoverPhoto = resolveHikeImageUrl(currentCoverPhoto, {
    width: imageSize === "home" ? 1400 : 1200,
    quality: 84,
  });
  const hikeSource = hike._source ?? "sheets";
  const detailId = hikeSource === "sheets" && hike._public_hike_id ? hike.route_id || String(hike._public_hike_id) : hike.id;
  const dogDifficultyLabel = getDifficultyLabel(hike.dog_difficulty);
  const humanDifficultyLabel = getDifficultyLabel(hike.difficulty);
  const seasonValues = useMemo(() => normalizeSeasonValues(hike.seasons, hike.season), [hike.season, hike.seasons]);
  const authorPreviewPhoto = useMemo(
    () => getDisplayImageUrl(hike.dog_photo_url || hike.author_avatar, { width: 128, quality: 70 }),
    [hike.author_avatar, hike.dog_photo_url],
  );
  const isPremiumHike = hike.is_premium === true;
  const previewIcon = seasonValues[0] ? getSeasonIcon(seasonValues[0]) : null;
  const previewSeasonBadgeClass = seasonValues[0] ? getSeasonBadgeClass(seasonValues[0]) : "";
  const elevationValue = hike.elevation_gain_m ?? hike.elevation_m;
  const routeStats = [
    hasMetricValue(hike.distance_km) ? { icon: TOUR_ICONS.distance, value: formatDistance(hike.distance_km), label: "Strecke" } : null,
    hasMetricValue(elevationValue) ? { icon: TOUR_ICONS.elevation, value: formatElevation(elevationValue), label: "Höhenmeter" } : null,
    hasMetricValue(hike.duration_minutes) ? { icon: TOUR_ICONS.duration, value: formatDurationHours(hike.duration_minutes), label: "Gehzeit" } : null,
  ].filter(Boolean);
  const waterChip = hike.water_availability ? (
    <span className={`inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1 rounded-full border px-2.5 py-1.5 text-center text-xs font-semibold leading-tight whitespace-normal break-words sm:text-sm md:px-3 md:text-xs ${getWaterBadgeClass(hike.water_availability)}`}>
      <WaterIcon value={hike.water_availability} /> {getWaterLabel(hike.water_availability) ?? hike.water_availability}
    </span>
  ) : null;
  const imageHeightClass = imageSize === "home" ? "h-56 sm:h-60" : "h-48 sm:h-52";

  useEffect(() => {
    setCoverPhotoIndex(0);
  }, [coverPhotosKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.42 }}
    >
      <Link
        to={createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=${hikeSource}`}
        state={{ hike }}
      >
        <div className="group overflow-hidden rounded-[22px] border border-brand-100/80 bg-white/78 shadow-[0_12px_28px_rgba(168,0,60,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(240,112,48,0.12)]">
          <div className={`relative overflow-hidden bg-gradient-to-br from-[#FDF0E8] via-[#F9C030]/40 to-[#D4547A]/35 ${imageHeightClass}`}>
            {resolvedCoverPhoto ? (
              <img
                src={resolvedCoverPhoto}
                alt={hike.trail_name}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
                onError={() => {
                  setCoverPhotoIndex((currentIndex) => {
                    const nextIndex = currentIndex + 1;
                    return nextIndex < cardPhotoSource.length ? nextIndex : -1;
                  });
                }}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : null}
            {PREMIUM_FEATURES_ENABLED && isPremiumHike && (
              <PremiumPawBadge className="pointer-events-none absolute left-4 top-4 min-h-9 border-white/65 px-3.5 py-2 text-sm shadow-sm" />
            )}

            {previewIcon && (
              <span className={`pointer-events-none absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border text-xl shadow-sm backdrop-blur-sm ${previewSeasonBadgeClass}`}>
                {previewIcon}
              </span>
            )}

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 p-3">
              <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-tight text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)]">
                {hike.trail_name}
              </h3>
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                <LocationIcon className="h-4 w-4" />
                <span className="truncate">{hike.location || "Dolomites"}</span>
              </div>
              {Array.isArray(hike.tags) && hike.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {hike.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex min-h-7 items-center rounded-full border border-[#F9C030]/70 bg-[#FDF0E8]/88 px-2.5 py-1 text-xs font-semibold leading-none text-[#7C3020] shadow-sm backdrop-blur-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {hike.tags.length > 3 && (
                    <span className="inline-flex min-h-7 items-center rounded-full border border-[#F9C030]/60 bg-[#FDF0E8]/78 px-2.5 py-1 text-xs font-semibold leading-none text-[#7C3020]/82 shadow-sm backdrop-blur-md">
                      +{hike.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {humanDifficultyLabel && (
                  <DifficultyScaleChip level={hike.difficulty} type="human" />
                )}
                {dogDifficultyLabel && (
                  <DifficultyScaleChip level={hike.dog_difficulty} type="dog" />
                )}
                {!waterInStatsRow && waterChip}
              </div>
              {(waterInStatsRow && waterChip) || routeStats.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {waterInStatsRow && waterChip}
                  {routeStats.map((stat) => (
                    <span
                      key={stat.label}
                      className={HIKE_CARD_STAT_CHIP_CLASS}
                      aria-label={`${stat.label}: ${stat.value}`}
                    >
                      <span className="text-sm leading-none">{stat.icon}</span>
                      <span className="min-w-0 whitespace-nowrap">{stat.value}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {hike.notes && (
              <div className="mb-3">
                <ExpandableText
                  text={hike.notes}
                  lines={descriptionLines}
                  className="text-sm font-normal leading-relaxed text-[#C07820]"
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
                          src={authorPreviewPhoto}
                          alt={hike.dog_name || hike.author_username || ""}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {(hike.dog_name || hike.author_username) && (
                      <span className="truncate text-sm font-medium text-[#C07820]">
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
                          src={getDisplayImageUrl(dog.photo_url, { width: 128, quality: 70 }) || getAvatarDataUrl(dog.name)}
                          alt={dog.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {hikeDogs.length > 0 && (
                      <span className="ml-1 truncate text-sm font-normal text-[#C07820]">
                        {hikeDogs.map((dog) => dog.name).join(", ")}
                      </span>
                    )}
                  </>
                )}
              </div>

              {hike.rating && (
                <div className="flex shrink-0 items-center gap-1">
                  <Star className="h-4 w-4 fill-[#A8003C] text-[#A8003C]" />
                  <span className="text-sm font-normal text-[#7C3020]">{hike.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
