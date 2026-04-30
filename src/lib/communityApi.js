import { supabase } from "./supabaseClient";

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

function normalizeForModeration(text) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00df/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

export async function getRatings(hikeId, hikeSource = "sheets") {
  const normalizedHikeId = String(hikeId);
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("hike_id", normalizedHikeId)
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

export async function getComments(hikeId, hikeSource = "sheets") {
  const normalizedHikeId = String(hikeId);
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;

  let query = supabase
    .from("comments")
    .select("*, profiles:user_id ( username, full_name, avatar_url )")
    .eq("hike_id", normalizedHikeId)
    .eq("hike_source", hikeSource)
    .order("created_at", { ascending: false });

  if (currentUserId) {
    query = query.or(`reported.eq.false,user_id.eq.${currentUserId}`);
  } else {
    query = query.eq("reported", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  const commentsWithPreview = await Promise.all(
    (data ?? []).map(async (comment) => {
      if (comment.photo_url?.startsWith("pending://") && currentUserId === comment.user_id) {
        return {
          ...comment,
          photo_preview_url: await createPendingCommentSignedUrl(comment.photo_url),
        };
      }

      return {
        ...comment,
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

const TRIGGER_WORDS = [
  "spam",
  "klick hier",
  "click here",
  "http://",
  "https://",
  "www.",
  "https://bit.ly",
  "t.me/",
  "whatsapp.com",
  "scheiss",
  "hurensohn",
  "wichser",
  "arschloch",
  "nazi",
  "fotze",
  "nutte",
  "fick",
  "kacke",
  "bastard",
  "asshole",
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "retard",
  "cazzo",
  "vaffanculo",
  "stronzo",
  "puttana",
  "merda",
];

export function containsTriggerWord(text) {
  const rawText = String(text ?? "").toLowerCase();
  const normalizedText = ` ${normalizeForModeration(text)} `;

  return TRIGGER_WORDS.some((word) => {
    const normalizedWord = normalizeForModeration(word);
    if (!normalizedWord) return false;

    if (/[/:.]/.test(word)) {
      return rawText.includes(word.toLowerCase());
    }

    const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedWord)}(?=\\s|$)`, "i");
    return pattern.test(normalizedText);
  });
}

export function commentNeedsReview(text) {
  return containsTriggerWord(text);
}

export async function uploadCommentPhoto(userId, file, { needsReview = false } = {}) {
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
