function loadImage(sourceUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = sourceUrl;
  });
}

export async function createSquareCropFile(
  sourceUrl,
  {
    focusX = 50,
    focusY = 50,
    zoom = 1,
    outputSize = 1200,
    fileName = "profile-image.jpg",
    mimeType = "image/jpeg",
    quality = 0.92,
  } = {}
) {
  const image = await loadImage(sourceUrl);
  const safeZoom = Math.max(1, Number(zoom) || 1);
  const cropSize = Math.max(
    1,
    Math.round(Math.min(image.naturalWidth, image.naturalHeight) / safeZoom)
  );
  const maxLeft = Math.max(0, image.naturalWidth - cropSize);
  const maxTop = Math.max(0, image.naturalHeight - cropSize);
  const sourceLeft = Math.min(maxLeft, Math.max(0, (maxLeft * focusX) / 100));
  const sourceTop = Math.min(maxTop, Math.max(0, (maxTop * focusY) / 100));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas_context_unavailable");
  }

  const releaseCanvasResources = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    image.src = "";
  };

  try {
    context.drawImage(
      image,
      sourceLeft,
      sourceTop,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error("image_export_failed"));
          return;
        }
        resolve(nextBlob);
      }, mimeType, quality);
    });

    return new File([blob], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    releaseCanvasResources();
  }
}
