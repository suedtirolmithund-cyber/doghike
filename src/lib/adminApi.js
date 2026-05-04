import { supabase } from "./supabaseClient";
import { publishPendingCommentPhoto } from "./communityApi";
import { hydrateJournalEntriesMedia, validatePublicJournalEntry } from "./journalApi";

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

export async function getPendingEntries() {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((e) => e.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );
  const hydratedEntries = await hydrateJournalEntriesMedia(data);
  return hydratedEntries.map((entry) => ({
    ...entry,
    profiles: profileMap[entry.user_id] ?? null,
  }));
}

export async function getAdminPublicHikes() {
  const { data, error } = await supabase
    .from("public_hikes")
    .select("id, title, location, country, status, is_premium, updated_at, created_at, image")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((hike) => ({
    ...hike,
    trail_name: hike.title,
    route_id: String(hike.id),
    _public_hike_id: hike.id,
    _source: "sheets",
    cover_photo: hike.image ?? null,
  }));
}

export async function approveEntry(id) {
  const { data: entry, error: fetchError } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  validatePublicJournalEntry(entry);

  const { error } = await supabase
    .from("journal_entries")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectEntry(id, reason) {
  const { error } = await supabase
    .from("journal_entries")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
}

export async function getAllComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const publicHikeIds = [...new Set(
    data
      .filter((comment) => (comment.hike_source ?? "sheets") === "sheets")
      .map((comment) => comment.hike_id)
      .filter(Boolean)
  )];
  const journalHikeIds = [...new Set(
    data
      .filter((comment) => comment.hike_source === "journal")
      .map((comment) => comment.hike_id)
      .filter(Boolean)
  )];

  const [{ data: publicHikes }, { data: journalEntries }] = await Promise.all([
    publicHikeIds.length
      ? supabase
          .from("public_hikes")
          .select("id, title")
          .in("id", publicHikeIds)
      : Promise.resolve({ data: [] }),
    journalHikeIds.length
      ? supabase
          .from("journal_entries")
          .select("id, title")
          .in("id", journalHikeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const hikeTitleMap = Object.fromEntries([
    ...(publicHikes ?? []).map((hike) => [`sheets:${hike.id}`, hike.title]),
    ...(journalEntries ?? []).map((entry) => [`journal:${entry.id}`, entry.title]),
  ]);

  const commentsWithPreview = await Promise.all(
    data.map(async (comment) => {
      const commentSource = comment.hike_source ?? "sheets";
      const storageDescriptor = getStorageDescriptor(comment.photo_url);

      if (storageDescriptor?.bucket === "comments-pending") {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("comments-pending")
          .createSignedUrl(storageDescriptor.path, 60 * 60);

        if (signedUrlError) {
          console.error("[getAllComments] pending photo preview failed:", signedUrlError.message);
        }

        return {
          ...comment,
          photo_preview_url: signedUrlData?.signedUrl ?? null,
          hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
          profiles: profileMap[comment.user_id] ?? null,
        };
      }

      if (storageDescriptor?.bucket === "comments") {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("comments")
          .createSignedUrl(storageDescriptor.path, 60 * 60);

        if (signedUrlError) {
          console.error("[getAllComments] approved photo preview failed:", signedUrlError.message);
        }

        return {
          ...comment,
          photo_preview_url: signedUrlData?.signedUrl ?? null,
          hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
          profiles: profileMap[comment.user_id] ?? null,
        };
      }

      return {
        ...comment,
        photo_preview_url: comment.photo_url ?? null,
        hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
        profiles: profileMap[comment.user_id] ?? null,
      };
    })
  );

  return commentsWithPreview;
}

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url, role, is_premium, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function approveComment(id) {
  const { data: existingComment, error: fetchError } = await supabase
    .from("comments")
    .select("photo_url")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const publishedPhotoUrl = await publishPendingCommentPhoto(existingComment?.photo_url);

  const { error } = await supabase
    .from("comments")
    .update({
      reported: false,
      reported_reason: null,
      photo_url: publishedPhotoUrl,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function adminDeleteComment(id) {
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
      console.error("[adminDeleteComment] photo cleanup failed:", storageError.message);
    }
  }
}

export async function adminDeleteUserAccount(userId) {
  const { error } = await supabase.rpc("admin_delete_user_account", {
    target_user_id: userId,
  });

  if (error) throw error;
}
