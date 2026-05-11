export const MAX_IMAGE_UPLOAD_MB = 15;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;

export function validateImageUpload(file) {
  if (!file || !file.type?.startsWith("image/")) return;

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const error = new Error(
      `Das Foto ist zu groß. Bitte wähle ein Bild unter ${MAX_IMAGE_UPLOAD_MB} MB.`
    );
    error.code = "IMAGE_TOO_LARGE";
    throw error;
  }
}

export function getImageUploadErrorMessage(
  error,
  fallback = "Das Foto konnte gerade nicht hochgeladen werden. Bitte versuche es noch einmal."
) {
  if (error?.code === "IMAGE_TOO_LARGE") {
    return error.message;
  }

  return fallback;
}
