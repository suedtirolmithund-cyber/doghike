import { supabase } from "./supabaseClient";
import { publishPendingCommentPhoto } from "./communityApi";
import { hydrateJournalEntriesMedia, validatePublicJournalEntry } from "./journalApi";
import { resolvePublicHikePhotoReferences } from "./publicHikesApi";

const PENDING_ENTRY_FIELDS = [
  "id",
  "user_id",
  "status",
  "created_at",
  "title",
  "location",
  "distance_km",
  "elevation_m",
  "photos",
  "description",
  "hazard_notes",
].join(", ");
const APPROVE_ENTRY_FIELDS = [
  "id",
  "title",
  "location",
  "latitude",
  "longitude",
  "distance_km",
  "elevation_m",
  "duration_minutes",
  "difficulty",
  "dog_difficulty",
  "water_available",
  "description",
  "photos",
  "seasons",
].join(", ");
const ADMIN_COMMENT_FIELDS = [
  "id",
  "user_id",
  "hike_id",
  "hike_source",
  "text",
  "photo_url",
  "reported",
  "reported_reason",
  "created_at",
].join(", ");
const ADMIN_PUBLIC_JOURNAL_HIKE_FIELDS = [
  "id",
  "user_id",
  "title",
  "location",
  "status",
  "visibility",
  "photos",
  "created_at",
  "date",
].join(", ");

function normalizeHikeSource(value) {
  return value ?? "sheets";
}

function escapeSearchTerm(value) {
  return String(value ?? "").trim().replace(/[\\%_]/g, "\\$&").replace(/,/g, " ");
}

async function assertAdmin() {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  if (!data) throw new Error("not_allowed");
}

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
  await assertAdmin();

  const { data, error } = await supabase
    .from("journal_entries")
    .select(PENDING_ENTRY_FIELDS)
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

export async function getAdminPublicHikeStats() {
  await assertAdmin();

  const [approvedResult, approvedJournalResult, draftResult, premiumResult] = await Promise.all([
    supabase
      .from("public_hikes")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("visibility", "public"),
    supabase
      .from("public_hikes")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("public_hikes")
      .select("id", { count: "exact", head: true })
      .eq("is_premium", true),
  ]);

  if (approvedResult.error) throw approvedResult.error;
  if (approvedJournalResult.error) throw approvedJournalResult.error;
  if (draftResult.error) throw draftResult.error;
  if (premiumResult.error) throw premiumResult.error;

  return {
    approvedCount: (approvedResult.count ?? 0) + (approvedJournalResult.count ?? 0),
    draftCount: draftResult.count ?? 0,
    premiumCount: premiumResult.count ?? 0,
  };
}

export async function getAdminPublicHikes({
  page = 1,
  pageSize = 24,
  search = "",
  statusFilter = "all",
  premiumFilter = "all",
} = {}) {
  await assertAdmin();

  const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const normalizedPageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 24;
  const trimmedSearch = search.trim();

  const escapedSearch = trimmedSearch.replace(/[%_,]/g, (char) => `\\${char}`);
  let publicHikesQuery = supabase
    .from("public_hikes")
    .select("id, title, location, country, status, is_premium, updated_at, created_at, image")
    .order("updated_at", { ascending: false });

  if (statusFilter !== "all") {
    publicHikesQuery = publicHikesQuery.eq("status", statusFilter);
  }

  if (premiumFilter === "premium") {
    publicHikesQuery = publicHikesQuery.eq("is_premium", true);
  } else if (premiumFilter === "free") {
    publicHikesQuery = publicHikesQuery.eq("is_premium", false);
  }

  if (trimmedSearch) {
    publicHikesQuery = publicHikesQuery.or(
      `title.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%,country.ilike.%${escapedSearch}%`
    );
  }

  let publicJournalQuery = supabase
    .from("journal_entries")
    .select(ADMIN_PUBLIC_JOURNAL_HIKE_FIELDS)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    publicJournalQuery = publicJournalQuery.eq("status", statusFilter);
  }

  if (premiumFilter === "premium") {
    publicJournalQuery = publicJournalQuery.eq("id", "__no_match__");
  }

  if (trimmedSearch) {
    publicJournalQuery = publicJournalQuery.or(
      `title.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%`
    );
  }

  const [
    { data: publicHikes = [], error: publicHikesError },
    { data: publicJournalEntries = [], error: publicJournalError },
  ] = await Promise.all([publicHikesQuery, publicJournalQuery]);

  if (publicHikesError) throw publicHikesError;
  if (publicJournalError) throw publicJournalError;

  const coverPhotos = await resolvePublicHikePhotoReferences(
    publicHikes.map((hike) => hike.image ?? null)
  );
  const hydratedJournalEntries = await hydrateJournalEntriesMedia(publicJournalEntries);

  const mergedItems = [
    ...publicHikes.map((hike, index) => ({
      ...hike,
      trail_name: hike.title,
      route_id: String(hike.id),
      _public_hike_id: hike.id,
      _source: "sheets",
      cover_photo: coverPhotos[index] ?? hike.image ?? null,
      _sort_date: hike.updated_at ?? hike.created_at ?? null,
    })),
    ...hydratedJournalEntries.map((entry) => ({
      ...entry,
      trail_name: entry.title,
      country: null,
      is_premium: false,
      route_id: String(entry.id),
      _journal_id: entry.id,
      _source: "journal",
      cover_photo: Array.isArray(entry.photos) ? entry.photos[0] ?? null : null,
      _sort_date: entry.created_at ?? entry.date ?? null,
    })),
  ].sort((left, right) => {
    const leftTime = left?._sort_date ? new Date(left._sort_date).getTime() : 0;
    const rightTime = right?._sort_date ? new Date(right._sort_date).getTime() : 0;
    return rightTime - leftTime;
  });

  const totalCount = mergedItems.length;
  const rangeStart = (normalizedPage - 1) * normalizedPageSize;
  const pagedItems = mergedItems.slice(rangeStart, rangeStart + normalizedPageSize);

  return {
    items: pagedItems,
    totalCount,
  };
}

async function resolveAdminCommentSearchTargets(trimmedSearch) {
  if (!trimmedSearch) {
    return {
      matchingUserIds: [],
      matchingPublicHikeIds: [],
      matchingJournalHikeIds: [],
    };
  }

  const escapedSearch = escapeSearchTerm(trimmedSearch);

  const [
    { data: matchingProfiles = [], error: matchingProfilesError },
    { data: matchingPublicHikes = [], error: matchingPublicHikesError },
    { data: matchingJournalEntries = [], error: matchingJournalEntriesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id")
      .or(`username.ilike.%${escapedSearch}%,full_name.ilike.%${escapedSearch}%`),
    supabase
      .from("public_hikes")
      .select("id")
      .ilike("title", `%${escapedSearch}%`),
    supabase
      .from("journal_entries")
      .select("id")
      .ilike("title", `%${escapedSearch}%`),
  ]);

  if (matchingProfilesError) throw matchingProfilesError;
  if (matchingPublicHikesError) throw matchingPublicHikesError;
  if (matchingJournalEntriesError) throw matchingJournalEntriesError;

  return {
    matchingUserIds: matchingProfiles.map((profile) => profile.user_id).filter(Boolean),
    matchingPublicHikeIds: matchingPublicHikes.map((hike) => hike.id).filter(Boolean),
    matchingJournalHikeIds: matchingJournalEntries.map((entry) => entry.id).filter(Boolean),
  };
}

export async function approveEntry(id) {
  await assertAdmin();

  const { data: entry, error: fetchError } = await supabase
    .from("journal_entries")
    .select(APPROVE_ENTRY_FIELDS)
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  validatePublicJournalEntry(entry);

  const { error } = await supabase.rpc("admin_approve_journal_entry", {
    target_entry_id: id,
  });
  if (error) throw error;
}

export async function rejectEntry(id, reason) {
  await assertAdmin();

  const { error } = await supabase.rpc("admin_reject_journal_entry", {
    target_entry_id: id,
    target_reason: reason ?? null,
  });
  if (error) throw error;
}

export async function getAdminComments({
  page = 1,
  pageSize = 50,
  search = "",
  filter = "all",
} = {}) {
  await assertAdmin();

  const normalizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const normalizedPageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 50;
  const trimmedSearch = search.trim();
  const rangeStart = (normalizedPage - 1) * normalizedPageSize;
  const rangeEnd = rangeStart + normalizedPageSize - 1;

  const pendingCountQuery = supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("reported", true);

  let commentsQuery = supabase
    .from("comments")
    .select(ADMIN_COMMENT_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    commentsQuery = commentsQuery.eq("reported", true);
  }

  if (trimmedSearch) {
    const escapedSearch = escapeSearchTerm(trimmedSearch);
    const {
      matchingUserIds,
      matchingPublicHikeIds,
      matchingJournalHikeIds,
    } = await resolveAdminCommentSearchTargets(trimmedSearch);

    const searchConditions = [`text.ilike.%${escapedSearch}%`];

    if (matchingUserIds.length > 0) {
      searchConditions.push(`user_id.in.(${matchingUserIds.join(",")})`);
    }

    if (matchingPublicHikeIds.length > 0) {
      searchConditions.push(
        `and(hike_source.eq.sheets,hike_id.in.(${matchingPublicHikeIds.join(",")}))`
      );
    }

    if (matchingJournalHikeIds.length > 0) {
      searchConditions.push(
        `and(hike_source.eq.journal,hike_id.in.(${matchingJournalHikeIds.join(",")}))`
      );
    }

    commentsQuery = commentsQuery.or(searchConditions.join(","));
  }

  const [
    { data, error, count },
    { count: pendingCount = 0, error: pendingCountError },
  ] = await Promise.all([commentsQuery.range(rangeStart, rangeEnd), pendingCountQuery]);

  if (pendingCountError) throw pendingCountError;
  if (error) throw error;
  if (!data?.length) {
    return {
      items: [],
      totalCount: count ?? 0,
      pendingCount,
    };
  }

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
      .filter((comment) => normalizeHikeSource(comment.hike_source) === "sheets")
      .map((comment) => comment.hike_id)
      .filter(Boolean)
  )];
  const journalHikeIds = [...new Set(
    data
      .filter((comment) => normalizeHikeSource(comment.hike_source) === "journal")
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
      const commentSource = normalizeHikeSource(comment.hike_source);
      const storageDescriptor = getStorageDescriptor(comment.photo_url);

      if (storageDescriptor?.bucket === "comments-pending") {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("comments-pending")
          .createSignedUrl(storageDescriptor.path, 60 * 60);

        if (signedUrlError) {
          console.error("[getAdminComments] pending photo preview failed:", signedUrlError.message);
        }

        return {
          ...comment,
          photo_preview_url: signedUrlData?.signedUrl ?? null,
          photo_preview_expires_at: signedUrlData?.signedUrl
            ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
            : null,
          hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
          profiles: profileMap[comment.user_id] ?? null,
        };
      }

      if (storageDescriptor?.bucket === "comments") {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("comments")
          .createSignedUrl(storageDescriptor.path, 60 * 60);

        if (signedUrlError) {
          console.error("[getAdminComments] approved photo preview failed:", signedUrlError.message);
        }

        return {
          ...comment,
          photo_preview_url: signedUrlData?.signedUrl ?? null,
          photo_preview_expires_at: signedUrlData?.signedUrl
            ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
            : null,
          hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
          profiles: profileMap[comment.user_id] ?? null,
        };
      }

      return {
        ...comment,
        photo_preview_url: comment.photo_url ?? null,
        photo_preview_expires_at: null,
        hike_title: hikeTitleMap[`${commentSource}:${comment.hike_id}`] ?? null,
        profiles: profileMap[comment.user_id] ?? null,
      };
    })
  );

  return {
    items: commentsWithPreview,
    totalCount: count ?? 0,
    pendingCount,
  };
}

export async function getAdminUsers() {
  await assertAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url, role, is_premium, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function approveComment(id) {
  await assertAdmin();

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
  await assertAdmin();

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
  await assertAdmin();

  const { error } = await supabase.rpc("admin_delete_user_account", {
    target_user_id: userId,
  });

  if (error) throw error;
}
