import { supabase } from "@/lib/supabaseClient";

const PUBLIC_HIKE_BUCKET = "journal";
const PUBLIC_HIKE_PREFIX = "public-hikes/";

function mapSupabaseWaterLevel(value) {
  if (value === 0 || value === "0") return "none";
  if (value === 1 || value === "1") return "little";
  if (value === 2 || value === "2") return "moderate";
  if (value === 3 || value === "3") return "plenty";
  return null;
}

function normalizePublicPhotoReference(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const bucketPrefix = `${PUBLIC_HIKE_BUCKET}/`;
  const publicMarker = "/storage/v1/object/public/";

  if (trimmed.startsWith(publicMarker)) {
    return `${import.meta.env.VITE_SUPABASE_URL}${trimmed}`;
  }

  if (trimmed.startsWith(bucketPrefix)) {
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${trimmed}`;
  }

  if (trimmed.startsWith(PUBLIC_HIKE_PREFIX)) {
    const {
      data: { publicUrl },
    } = supabase.storage.from(PUBLIC_HIKE_BUCKET).getPublicUrl(trimmed);
    return publicUrl;
  }

  return trimmed;
}

function getLegacyPhotoColumns(row) {
  return [
    row?.image,
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
    row?.foto,
    row?.foto2,
    row?.foto3,
    row?.foto4,
    row?.foto5,
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
    row?.["foto 2"],
    row?.["foto 3"],
    row?.["foto 4"],
    row?.["foto 5"],
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
    row?.image_2,
    row?.image_3,
    row?.image_4,
    row?.image_5,
  ]
    .map((value) => normalizePublicPhotoReference(value))
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

  const marker = `/storage/v1/object/public/${PUBLIC_HIKE_BUCKET}/${PUBLIC_HIKE_PREFIX}`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) return null;

  return {
    bucket: PUBLIC_HIKE_BUCKET,
    path: decodeURIComponent(photoUrl.slice(index + `/storage/v1/object/public/${PUBLIC_HIKE_BUCKET}/`.length)),
  };
}

export async function uploadPublicHikePhoto(userId, file) {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${PUBLIC_HIKE_PREFIX}${userId}/${Date.now()}_${sanitizedName}`;
  const { data, error } = await supabase.storage
    .from(PUBLIC_HIKE_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PUBLIC_HIKE_BUCKET).getPublicUrl(data.path);

  return publicUrl;
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

  return {
    ...hikeRow,
    trail_name: hikeRow.title,
    route_id: String(hikeRow.id),
    _public_hike_id: hikeRow.id,
    _source: "sheets",
    photos: mergePhotoLists(
      photoRows.map((photo) => photo.photo_url),
      getLegacyPhotoColumns(hikeRow)
    ),
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
    .map((url) => url.trim())
    .filter(Boolean);
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
