export const MAX_IMAGE_UPLOAD_MB = 15;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2200;
const IMAGE_OPTIMIZATION_MIN_BYTES = 1.5 * 1024 * 1024;
const IMAGE_OPTIMIZATION_QUALITY = 0.82;

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

function getFileExtensionForMimeType(mimeType, fallbackName = "upload") {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  const fallbackExt = fallbackName.split(".").pop();
  return fallbackExt || "jpg";
}

function buildOptimizedFileName(fileName, mimeType) {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "upload";
  const extension = getFileExtensionForMimeType(mimeType, fileName);
  return `${baseName}.${extension}`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("IMAGE_LOAD_FAILED"));
    };

    image.src = objectUrl;
  });
}

async function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function optimizeImageForUpload(file) {
  validateImageUpload(file);

  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof HTMLCanvasElement === "undefined" ||
    !file?.type?.startsWith("image/")
  ) {
    return file;
  }

  const sourceImage = await loadImageFromFile(file);
  const needsResize =
    sourceImage.width > MAX_IMAGE_DIMENSION || sourceImage.height > MAX_IMAGE_DIMENSION;
  const shouldOptimize = needsResize || file.size >= IMAGE_OPTIMIZATION_MIN_BYTES;

  if (!shouldOptimize) {
    return file;
  }

  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(sourceImage.width, sourceImage.height)
  );
  const targetWidth = Math.max(1, Math.round(sourceImage.width * scale));
  const targetHeight = Math.max(1, Math.round(sourceImage.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(sourceImage, 0, 0, targetWidth, targetHeight);

  const preferredType = file.type === "image/png" ? "image/webp" : "image/jpeg";
  const optimizedBlob =
    (await canvasToBlob(canvas, preferredType, IMAGE_OPTIMIZATION_QUALITY)) ||
    (await canvasToBlob(canvas, "image/jpeg", IMAGE_OPTIMIZATION_QUALITY));

  if (!optimizedBlob || optimizedBlob.size >= file.size * 0.95) {
    return file;
  }

  return new File(
    [optimizedBlob],
    buildOptimizedFileName(file.name, optimizedBlob.type || preferredType),
    {
      type: optimizedBlob.type || preferredType,
      lastModified: Date.now(),
    }
  );
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
