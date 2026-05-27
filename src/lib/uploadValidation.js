export const MAX_IMAGE_UPLOAD_MB = 15;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
const MAX_IMAGE_SOURCE_MB = 50;
const MAX_IMAGE_SOURCE_BYTES = MAX_IMAGE_SOURCE_MB * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_OPTIMIZATION_MIN_BYTES = 1.25 * 1024 * 1024;
const IMAGE_OPTIMIZATION_QUALITY_STEPS = [0.82, 0.78, 0.74, 0.7, 0.66, 0.62, 0.58];
const IMAGE_OPTIMIZATION_SCALE_STEPS = [1, 0.92, 0.84, 0.76, 0.68];

function createImageTooLargeError(limitMb) {
  const error = new Error(
    `Das Foto ist zu groß. Bitte wähle ein Bild unter ${limitMb} MB.`
  );
  error.code = "IMAGE_TOO_LARGE";
  return error;
}

export function validateImageUpload(file) {
  if (!file || !file.type?.startsWith("image/")) return;

  if (file.size > MAX_IMAGE_SOURCE_BYTES) {
    throw createImageTooLargeError(MAX_IMAGE_SOURCE_MB);
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

function buildTargetDimensions(sourceImage) {
  const baseScale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(sourceImage.width, sourceImage.height)
  );

  return IMAGE_OPTIMIZATION_SCALE_STEPS.map((step) => {
    const scaledWidth = Math.max(1, Math.round(sourceImage.width * baseScale * step));
    const scaledHeight = Math.max(1, Math.round(sourceImage.height * baseScale * step));
    return { width: scaledWidth, height: scaledHeight };
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
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw createImageTooLargeError(MAX_IMAGE_UPLOAD_MB);
    }
    return file;
  }

  const sourceImage = await loadImageFromFile(file);
  const needsResize =
    sourceImage.width > MAX_IMAGE_DIMENSION || sourceImage.height > MAX_IMAGE_DIMENSION;
  const shouldOptimize =
    needsResize ||
    file.size >= IMAGE_OPTIMIZATION_MIN_BYTES ||
    file.size > MAX_IMAGE_UPLOAD_BYTES;

  if (!shouldOptimize) {
    return file;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw createImageTooLargeError(MAX_IMAGE_UPLOAD_MB);
    }
    return file;
  }

  const preferredType = file.type === "image/png" ? "image/webp" : "image/jpeg";
  let bestBlob = null;

  for (const dimension of buildTargetDimensions(sourceImage)) {
    canvas.width = dimension.width;
    canvas.height = dimension.height;
    context.clearRect(0, 0, dimension.width, dimension.height);
    context.drawImage(sourceImage, 0, 0, dimension.width, dimension.height);

    for (const quality of IMAGE_OPTIMIZATION_QUALITY_STEPS) {
      const candidateBlob =
        (await canvasToBlob(canvas, preferredType, quality)) ||
        (await canvasToBlob(canvas, "image/jpeg", quality));

      if (!candidateBlob) continue;

      if (!bestBlob || candidateBlob.size < bestBlob.size) {
        bestBlob = candidateBlob;
      }

      if (candidateBlob.size <= MAX_IMAGE_UPLOAD_BYTES) {
        bestBlob = candidateBlob;
        break;
      }
    }

    if (bestBlob?.size <= MAX_IMAGE_UPLOAD_BYTES) {
      break;
    }
  }

  if (!bestBlob) {
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw createImageTooLargeError(MAX_IMAGE_UPLOAD_MB);
    }
    return file;
  }

  if (bestBlob.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw createImageTooLargeError(MAX_IMAGE_UPLOAD_MB);
  }

  if (bestBlob.size >= file.size * 0.98 && file.size <= MAX_IMAGE_UPLOAD_BYTES) {
    return file;
  }

  return new File(
    [bestBlob],
    buildOptimizedFileName(file.name, bestBlob.type || preferredType),
    {
      type: bestBlob.type || preferredType,
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
