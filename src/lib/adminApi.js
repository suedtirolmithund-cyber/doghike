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
  const marker = "/storage/v1/object/public/comments/";
  const index = photoReference.indexOf(marker);
  if (index === -1) return null;
  return {
    bucket: "comments",
    path: decodeURIComponent(photoReference.slice(index + marker.length)),
  };
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

  const commentsWithPreview = await Promise.all(
    data.map(async (comment) => {
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
          profiles: profileMap[comment.user_id] ?? null,
        };
      }

      return {
        ...comment,
        photo_preview_url: comment.photo_url ?? null,
        profiles: profileMap[comment.user_id] ?? null,
      };
    })
  );

  return commentsWithPreview;
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
