"use client";

export async function resizeImageToDataUrl(
  file: File,
  maxDim = 256,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== "string") {
        reject(new Error("Unexpected file reader result"));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Image failed to load"));
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err instanceof Error ? err : new Error("toDataURL failed"));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
