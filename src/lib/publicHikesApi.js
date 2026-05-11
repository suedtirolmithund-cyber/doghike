import { supabase } from "@/lib/supabaseClient";
import { validateImageUpload } from "@/lib/uploadValidation";

const PUBLIC_HIKE_BUCKET = "journal";
const PUBLIC_HIKE_PREFIX = "public-hikes/";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function mapSupabaseWaterLevel(value) {
  if (value === 0 || value === "0") return "none";
  if (value === 1 || value === "1") return "little";
  if (value === 2 || value === "2") return "moderate";
  if (value === 3 || value === "3") return "plenty";
  return null;
}

function normalizeOptionalText(value) {
  if (typeof value !== "string") return value ?? null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "null") return null;
  return trimmed;
}

function pickFirstText(row, keys) {
  for (const key of keys) {
    const value = normalizeOptionalText(row?.[key]);
    if (value) return value;
  }
  return null;
}

function splitTagString(value) {
  return value
    .split(/[,#;|]/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

function normalizeTags(...values) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value
            .map((tag) => String(tag).trim().replace(/^#+/, ""))
            .filter(Boolean);
        }

        if (typeof value === "string") {
          return splitTagString(value);
        }

        return [];
      })
    )
  );
}

function getLegacyTagColumns(row) {
  return [
    row?.tags,
    row?.tag,
    row?.tag1,
    row?.tag2,
    row?.tag3,
    row?.tag4,
    row?.tag5,
    row?.tags2,
    row?.tags3,
    row?.tags4,
    row?.tags5,
    row?.["tag 1"],
    row?.["tag 2"],
    row?.["tag 3"],
    row?.["tag 4"],
    row?.["tag 5"],
    row?.tag_1,
    row?.tag_2,
    row?.tag_3,
    row?.tag_4,
    row?.tag_5,
  ];
}

export function normalizeStoredPublicPhotoReference(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const storageDescriptor = getPublicHikeStorageDescriptor(trimmed);
  if (storageDescriptor) {
    return storageDescriptor.path;
  }

  return trimmed;
}

function getLegacyPhotoColumns(row) {
  return [
    row?.image,
    row?.bild,
    row?.bilder,
    row?.image2,
    row?.image3,
    row?.image4,
    row?.image5,
    row?.image6,
    row?.image7,
    row?.image8,
    row?.image9,
    row?.image10,
    row?.photo,
    row?.photo2,
    row?.photo3,
    row?.photo4,
    row?.photo5,
    row?.photo6,
    row?.photo7,
    row?.photo8,
    row?.photo9,
    row?.photo10,
    row?.foto,
    row?.foto2,
    row?.foto3,
    row?.foto4,
    row?.foto5,
    row?.foto6,
    row?.foto7,
    row?.foto8,
    row?.foto9,
    row?.foto10,
    row?.bild2,
    row?.bild3,
    row?.bild4,
    row?.bild5,
    row?.fotos,
    row?.fotos2,
    row?.fotos3,
    row?.fotos4,
    row?.fotos5,
    row?.["image 2"],
    row?.["image 3"],
    row?.["image 4"],
    row?.["image 5"],
    row?.["photo 2"],
    row?.["photo 3"],
    row?.["photo 4"],
    row?.["photo 5"],
    row?.["photo 6"],
    row?.["photo 7"],
    row?.["photo 8"],
    row?.["photo 9"],
    row?.["photo 10"],
    row?.["foto 2"],
    row?.["foto 3"],
    row?.["foto 4"],
    row?.["foto 5"],
    row?.["foto 6"],
    row?.["foto 7"],
    row?.["foto 8"],
    row?.["foto 9"],
    row?.["foto 10"],
    row?.["bild 2"],
    row?.["bild 3"],
    row?.["bild 4"],
    row?.["bild 5"],
    row?.["fotos 2"],
    row?.["fotos 3"],
    row?.["fotos 4"],
    row?.["fotos 5"],
    row?.foto_2,
    row?.foto_3,
    row?.foto_4,
    row?.foto_5,
    row?.photo_2,
    row?.photo_3,
    row?.photo_4,
    row?.photo_5,
    row?.photo_6,
    row?.photo_7,
    row?.photo_8,
    row?.photo_9,
    row?.photo_10,
    row?.image_2,
    row?.image_3,
    row?.image_4,
    row?.image_5,
    row?.image_6,
    row?.image_7,
    row?.image_8,
    row?.image_9,
    row?.image_10,
    row?.foto_6,
    row?.foto_7,
    row?.foto_8,
    row?.foto_9,
    row?.foto_10,
    row?.bild_2,
    row?.bild_3,
    row?.bild_4,
    row?.bild_5,
  ]
    .map((value) => normalizeStoredPublicPhotoReference(value))
    .filter(Boolean);
}

function mergePhotoLists(...photoLists) {
  return Array.from(
    new Set(
      photoLists.flatMap((photoList) =>
        Array.isArray(photoList)
          ? photoList.map((photo) => (typeof photo === "string" ? photo.trim() : "")).filter(Boolean)
          : []
      )
    )
  );
}

function getPublicHikeStorageDescriptor(photoUrl) {
  if (!photoUrl || typeof photoUrl !== "string") return null;

  const trimmed = photoUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(PUBLIC_HIKE_PREFIX)) {
    return {
      bucket: PUBLIC_HIKE_BUCKET,
      path: trimmed,
    };
  }

  const bucketPrefix = `${PUBLIC_HIKE_BUCKET}/${PUBLIC_HIKE_PREFIX}`;
  if (trimmed.startsWith(bucketPrefix)) {
    return {
      bucket: PUBLIC_HIKE_BUCKET,
      path: trimmed.slice(`${PUBLIC_HIKE_BUCKET}/`.length),
    };
  }

  try {
    const url = new URL(trimmed);
    const publicMarker = `/storage/v1/object/public/${PUBLIC_HIKE_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${PUBLIC_HIKE_BUCKET}/`;
    const pathname = url.pathname;

    if (pathname.includes(publicMarker)) {
      return {
        bucket: PUBLIC_HIKE_BUCKET,
        path: decodeURIComponent(pathname.slice(pathname.indexOf(publicMarker) + publicMarker.length)),
      };
    }

    if (pathname.includes(signedMarker)) {
      return {
        bucket: PUBLIC_HIKE_BUCKET,
        path: decodeURIComponent(pathname.slice(pathname.indexOf(signedMarker) + signedMarker.length)),
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function createPublicHikePhotoDisplayUrl(photoReference) {
  const storageDescriptor = getPublicHikeStorageDescriptor(photoReference);
  if (!storageDescriptor) {
    return normalizeStoredPublicPhotoReference(photoReference);
  }

  const { data, error } = await supabase.storage
    .from(storageDescriptor.bucket)
    .createSignedUrl(storageDescriptor.path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[createPublicHikePhotoDisplayUrl] signed URL failed:", error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function resolvePublicHikePhotoReferences(photoReferences = []) {
  const resolvedPhotos = await Promise.all(
    photoReferences.map((photoReference) => createPublicHikePhotoDisplayUrl(photoReference))
  );

  return resolvedPhotos.filter(Boolean);
}

export async function uploadPublicHikePhoto(userId, file) {
  validateImageUpload(file);
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${PUBLIC_HIKE_PREFIX}${userId}/${Date.now()}_${sanitizedName}`;
  const { data, error } = await supabase.storage
    .from(PUBLIC_HIKE_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return data.path;
}

export async function deleteUploadedPublicHikePhoto(photoUrl) {
  const storageDescriptor = getPublicHikeStorageDescriptor(photoUrl);
  if (!storageDescriptor) return;

  const { error } = await supabase.storage
    .from(storageDescriptor.bucket)
    .remove([storageDescriptor.path]);

  if (error) throw error;
}

export async function getPublicHikeById(hikeId) {
  const { data: hikeRow, error: hikeError } = await supabase
    .from("public_hikes")
    .select("*")
    .eq("id", hikeId)
    .maybeSingle();

  if (hikeError) throw hikeError;
  if (!hikeRow) return null;

  const { data: photoRows = [], error: photosError } = await supabase
    .from("public_hike_photos")
    .select("photo_url, sort_order")
    .eq("hike_id", hikeId)
    .order("sort_order", { ascending: true });

  if (photosError) throw photosError;

  const photoReferences = mergePhotoLists(
    photoRows.map((photo) => photo.photo_url),
    getLegacyPhotoColumns(hikeRow)
  );
  const resolvedPhotos = await resolvePublicHikePhotoReferences(photoReferences);

  return {
    ...hikeRow,
    trail_name: pickFirstText(hikeRow, ["title", "trail_name", "name", "tour", "tour_name"]) || hikeRow.title,
    route_id: String(hikeRow.id),
    _public_hike_id: hikeRow.id,
    _source: "sheets",
    _photo_references: photoReferences,
    tags: normalizeTags(...getLegacyTagColumns(hikeRow)),
    photos: resolvedPhotos,
    hazard_notes: pickFirstText(hikeRow, ["hazard_notes", "hazards", "danger_notes", "danger", "warning", "warnings", "achtung", "gefahr", "gefahren"]),
    parking_info: pickFirstText(hikeRow, ["parking_info", "parking", "parking_notes", "parken", "ausgangspunkt"]),
    restaurant_info: pickFirstText(hikeRow, ["restaurant_info", "restaurant", "restaurant_notes", "einkehr", "hutte", "hütte"]),
    notes: pickFirstText(hikeRow, ["notes", "description", "beschreibung", "text", "details", "tipps"]),
    water_availability: mapSupabaseWaterLevel(hikeRow.water_availability),
    difficulty: hikeRow.difficulty != null ? String(hikeRow.difficulty) : null,
    dog_difficulty: hikeRow.dog_difficulty != null ? String(hikeRow.dog_difficulty) : null,
  };
}

export async function updatePublicHike(hikeId, values) {
  const {
    photoUrls = [],
    tags = [],
    ...hikeValues
  } = values;
  const cleanedPhotoUrls = photoUrls
    .map((url) => normalizeStoredPublicPhotoReference(url))
    .filter(Boolean);
  const legacyPhotoColumns = {
    image: cleanedPhotoUrls[0] || null,
    image2: cleanedPhotoUrls[1] || null,
    image3: cleanedPhotoUrls[2] || null,
    image4: cleanedPhotoUrls[3] || null,
  };
  const { data: existingPhotos = [], error: existingPhotosError } = await supabase
    .from("public_hike_photos")
    .select("photo_url, sort_order")
    .eq("hike_id", hikeId)
    .order("sort_order", { ascending: true });

  if (existingPhotosError) throw existingPhotosError;
  const existingPhotoUrls = existingPhotos.map((photo) => photo.photo_url).filter(Boolean);

  const { data, error } = await supabase
    .from("public_hikes")
    .update({
      ...hikeValues,
      ...legacyPhotoColumns,
      tags,
    })
    .eq("id", hikeId)
    .select()
    .single();

  if (error) throw error;

  const { error: deletePhotosError } = await supabase
    .from("public_hike_photos")
    .delete()
    .eq("hike_id", hikeId);

  if (deletePhotosError) throw deletePhotosError;

  if (cleanedPhotoUrls.length > 0) {
    const { error: insertPhotosError } = await supabase
      .from("public_hike_photos")
      .insert(
        cleanedPhotoUrls.map((photoUrl, index) => ({
          hike_id: hikeId,
          photo_url: photoUrl,
          sort_order: index,
        }))
      );

    if (insertPhotosError) {
      if (existingPhotos.length > 0) {
        await supabase
          .from("public_hike_photos")
          .insert(
            existingPhotos.map((photo) => ({
              hike_id: hikeId,
              photo_url: photo.photo_url,
              sort_order: photo.sort_order ?? 0,
            }))
          );
      }
      throw insertPhotosError;
    }
  }

  const removedManagedPhotoUrls = existingPhotoUrls.filter(
    (photoUrl) =>
      !cleanedPhotoUrls.includes(photoUrl) && getPublicHikeStorageDescriptor(photoUrl)
  );

  await Promise.all(
    removedManagedPhotoUrls.map(async (photoUrl) => {
      try {
        await deleteUploadedPublicHikePhoto(photoUrl);
      } catch (storageError) {
        console.error("[updatePublicHike] removed photo cleanup failed:", storageError.message);
      }
    })
  );

  return data;
}
