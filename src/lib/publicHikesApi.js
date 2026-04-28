import { supabase } from "@/lib/supabaseClient";

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

  return data;
}
