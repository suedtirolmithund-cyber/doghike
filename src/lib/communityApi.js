import { supabase } from "./supabaseClient";
import { validateImageUpload } from "./uploadValidation";

const COMMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

function getStorageDescriptor(photoReference) {
  if (!photoReference) return null;

  if (photoReference.startsWith("pending://")) {
    return {
      bucket: "comments-pending",
      path: photoReference.slice("pending://".length),
    };
  }

  const trimmed = photoReference.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("comments/")) {
    return {
      bucket: "comments",
      path: trimmed.slice("comments/".length),
    };
  }

  try {
    const url = new URL(trimmed);
    const publicMarker = "/storage/v1/object/public/comments/";
    const signedMarker = "/storage/v1/object/sign/comments/";
    const pathname = url.pathname;

    if (pathname.includes(publicMarker)) {
      return {
        bucket: "comments",
        path: decodeURIComponent(pathname.slice(pathname.indexOf(publicMarker) + publicMarker.length)),
      };
    }

    if (pathname.includes(signedMarker)) {
      return {
        bucket: "comments",
        path: decodeURIComponent(pathname.slice(pathname.indexOf(signedMarker) + signedMarker.length)),
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function createPendingCommentSignedUrl(photoReference) {
  const storageDescriptor = getStorageDescriptor(photoReference);
  if (!storageDescriptor || storageDescriptor.bucket !== "comments-pending") {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("comments-pending")
    .createSignedUrl(storageDescriptor.path, COMMENT_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[createPendingCommentSignedUrl] signed URL failed:", error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

async function createCommentPhotoDisplayUrl(photoReference) {
  const storageDescriptor = getStorageDescriptor(photoReference);
  if (!storageDescriptor) {
    return photoReference ?? null;
  }

  const { data, error } = await supabase.storage
    .from(storageDescriptor.bucket)
    .createSignedUrl(storageDescriptor.path, COMMENT_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[createCommentPhotoDisplayUrl] signed URL failed:", error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function getSavedHikes(userId) {
  const { data, error } = await supabase
    .from("saved_hikes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveHike(userId, hikeId, hikeSource = "sheets") {
  const normalizedHikeId = String(hikeId);
  const { data, error } = await supabase
    .from("saved_hikes")
    .upsert(
      { user_id: userId, hike_id: normalizedHikeId, hike_source: hikeSource },
      { onConflict: "user_id,hike_id,hike_source" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unsaveHike(userId, hikeId, hikeSource = "sheets") {
  const normalizedHikeId = String(hikeId);
  const { error } = await supabase
    .from("saved_hikes")
    .delete()
    .eq("user_id", userId)
    .eq("hike_id", normalizedHikeId)
    .eq("hike_source", hikeSource);
  if (error) throw error;
}

export async function getRatings(hikeId, hikeSource = "sheets", alternateHikeIds = []) {
  const normalizedHikeIds = Array.from(
    new Set([hikeId, ...alternateHikeIds].map((value) => String(value)).filter(Boolean))
  );
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .in("hike_id", normalizedHikeIds)
    .eq("hike_source", hikeSource);
  if (error) throw error;
  return data ?? [];
}

export async function upsertRating(userId, hikeId, hikeSource = "sheets", rating) {
  const normalizedHikeId = String(hikeId);
  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      { user_id: userId, hike_id: normalizedHikeId, hike_source: hikeSource, rating },
      { onConflict: "user_id,hike_id,hike_source" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getComments(hikeId, hikeSource = "sheets", alternateHikeIds = []) {
  const normalizedHikeIds = Array.from(
    new Set([hikeId, ...alternateHikeIds].map((value) => String(value)).filter(Boolean))
  );
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;

  let query = supabase
    .from("comments")
    .select("*")
    .in("hike_id", normalizedHikeIds)
    .eq("hike_source", hikeSource)
    .order("created_at", { ascending: false });

  if (currentUserId) {
    query = query.or(`reported.eq.false,user_id.eq.${currentUserId}`);
  } else {
    query = query.eq("reported", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  const userIds = Array.from(new Set((data ?? []).map((comment) => comment.user_id).filter(Boolean)));
  let profileMap = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, avatar_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("[getComments] profile lookup failed:", profilesError.message);
    } else {
      profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));
    }
  }

  const commentsWithPreview = await Promise.all(
    (data ?? []).map(async (comment) => {
      if (comment.photo_url?.startsWith("pending://") && currentUserId === comment.user_id) {
        return {
          ...comment,
          profiles: profileMap[comment.user_id] ?? null,
          photo_preview_url: await createPendingCommentSignedUrl(comment.photo_url),
        };
      }

      return {
        ...comment,
        profiles: profileMap[comment.user_id] ?? null,
        photo_preview_url: await createCommentPhotoDisplayUrl(comment.photo_url),
      };
    })
  );

  return commentsWithPreview;
}

export async function createComment(
  userId,
  hikeId,
  hikeSource = "sheets",
  text,
  photoUrl = null,
  needsReview = false
) {
  const normalizedHikeId = String(hikeId);
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: userId,
      hike_id: normalizedHikeId,
      hike_source: hikeSource,
      text,
      photo_url: photoUrl,
      reported: needsReview,
      reported_reason: needsReview ? "trigger_word" : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { data: existingComment, error: fetchError } = await supabase
    .from("comments")
    .select("photo_url")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;

  const storageDescriptor = getStorageDescriptor(existingComment?.photo_url);
  if (storageDescriptor) {
    const { error: storageError } = await supabase.storage
      .from(storageDescriptor.bucket)
      .remove([storageDescriptor.path]);
    if (storageError) {
      console.error("[deleteComment] photo cleanup failed:", storageError.message);
    }
  }
}

export function commentNeedsReview(text) {
  return false;
}

export async function uploadCommentPhoto(userId, file, { needsReview = false } = {}) {
  validateImageUpload(file);
  const bucket = needsReview ? "comments-pending" : "comments";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}_${sanitizedName}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;

  if (needsReview) {
    return `pending://${data.path}`;
  }

  return `comments/${data.path}`;
}

export async function deleteUploadedCommentPhoto(photoReference) {
  const storageDescriptor = getStorageDescriptor(photoReference);
  if (!storageDescriptor) return;

  const { error } = await supabase.storage
    .from(storageDescriptor.bucket)
    .remove([storageDescriptor.path]);
  if (error) {
    console.error("[deleteUploadedCommentPhoto] cleanup failed:", error.message);
  }
}

export async function publishPendingCommentPhoto(photoReference) {
  const storageDescriptor = getStorageDescriptor(photoReference);
  if (!storageDescriptor || storageDescriptor.bucket !== "comments-pending") {
    return photoReference;
  }

  const { data, error } = await supabase.storage
    .from("comments-pending")
    .download(storageDescriptor.path);
  if (error) throw error;

  const { error: uploadError } = await supabase.storage
    .from("comments")
    .upload(storageDescriptor.path, data, { upsert: true });
  if (uploadError) throw uploadError;

  const { error: removeError } = await supabase.storage
    .from("comments-pending")
    .remove([storageDescriptor.path]);
  if (removeError) {
    console.error("[publishPendingCommentPhoto] cleanup failed:", removeError.message);
  }

  return `comments/${storageDescriptor.path}`;
}
