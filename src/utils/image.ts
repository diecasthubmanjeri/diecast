/**
 * Automatically detects solid dark (black) or light (white) background colors 
 * and removes them using flood-fill on HTML Canvas, returning a transparent PNG Data URL.
 * Will NOT modify images that already contain transparency!
 */
export const removeImageBackground = (imgElement: HTMLImageElement, maxWidth = 600, maxHeight = 600): string => {
  const canvas = document.createElement('canvas');
  let width = imgElement.naturalWidth || imgElement.width;
  let height = imgElement.naturalHeight || imgElement.height;

  if (width === 0 || height === 0) return imgElement.src;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imgElement.src;

  ctx.drawImage(imgElement, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Check if image ALREADY has transparent pixels (e.g. valid PNG)
  let transparentCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) {
      transparentCount++;
      if (transparentCount > 10) {
        // Image already has transparency! Preserve original image untouched.
        return canvas.toDataURL('image/png');
      }
    }
  }

  // 2. For non-transparent images (e.g. JPGs with solid bg)
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1]
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR = Math.round(bgR / corners.length);
  bgG = Math.round(bgG / corners.length);
  bgB = Math.round(bgB / corners.length);

  // Check if background is solid dark or light
  const isDarkBg = bgR < 40 && bgG < 40 && bgB < 40;
  const isLightBg = bgR > 215 && bgG > 215 && bgB > 215;

  if (isDarkBg || isLightBg) {
    // Strict tolerance to prevent eating black tyres or dark vehicle details
    const tolerance = isDarkBg ? 20 : 35;
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    // Add border pixels to queue if they match bg color
    for (let x = 0; x < width; x++) {
      for (const y of [0, height - 1]) {
        const idx = y * width + x;
        const pIdx = idx * 4;
        if (Math.abs(data[pIdx] - bgR) <= tolerance &&
            Math.abs(data[pIdx + 1] - bgG) <= tolerance &&
            Math.abs(data[pIdx + 2] - bgB) <= tolerance) {
          visited[idx] = 1;
          queue.push(x, y);
        }
      }
    }
    for (let y = 0; y < height; y++) {
      for (const x of [0, width - 1]) {
        const idx = y * width + x;
        if (!visited[idx]) {
          const pIdx = idx * 4;
          if (Math.abs(data[pIdx] - bgR) <= tolerance &&
              Math.abs(data[pIdx + 1] - bgG) <= tolerance &&
              Math.abs(data[pIdx + 2] - bgB) <= tolerance) {
            visited[idx] = 1;
            queue.push(x, y);
          }
        }
      }
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const cIdx = (cy * width + cx) * 4;
      data[cIdx + 3] = 0; // Set alpha to transparent

      const neighbors = [
        [cx - 1, cy], [cx + 1, cy],
        [cx, cy - 1], [cx, cy + 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            const npIdx = nIdx * 4;
            if (Math.abs(data[npIdx] - bgR) <= tolerance &&
                Math.abs(data[npIdx + 1] - bgG) <= tolerance &&
                Math.abs(data[npIdx + 2] - bgB) <= tolerance) {
              visited[nIdx] = 1;
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL('image/png');
};

export const processFileToTransparentPng = (fileOrDataUrl: File | string, maxWidth = 600, maxHeight = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const result = removeImageBackground(img, maxWidth, maxHeight);
        resolve(result);
      } catch (err) {
        console.error("Error processing image background:", err);
        resolve(img.src);
      }
    };

    img.onerror = () => {
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
