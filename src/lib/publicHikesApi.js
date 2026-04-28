import { supabase } from "@/lib/supabaseClient";

export async function updatePublicHike(hikeId, values) {
  const {
    photoUrls = [],
    ...hikeValues
  } = values;

  const { data, error } = await supabase
    .from("public_hikes")
    .update(hikeValues)
    .eq("id", hikeId)
    .select()
    .single();

  if (error) throw error;

  const { error: deletePhotosError } = await supabase
    .from("public_hike_photos")
    .delete()
    .eq("hike_id", hikeId);

  if (deletePhotosError) throw deletePhotosError;

  const cleanedPhotoUrls = photoUrls
    .map((url) => url.trim())
    .filter(Boolean);

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

    if (insertPhotosError) throw insertPhotosError;
  }

  return data;
}
