/**
 * Image AI Utilities for Almaty CatSearch
 */

/**
 * Resizes and compresses a base64 image string into a JPEG Blob.
 * Limits max dimensions to keep storage footprint minimal (80-100KB per photo).
 */
export const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed JPEG blob (quality 0.75)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Сжатие изображения не удалось.'));
          }
        },
        'image/jpeg',
        0.75
      );
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Extracts a 64-dimensional Color Layout descriptor vector from an image.
 * Resizes the image to 4x4 pixels, capturing the spatial layout of Red, Green, Blue
 * channels and Grayscale brightness. Normalizes the vector for cosine similarity search.
 */
export const extractImageEmbedding = (base64Str) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 4, 4);

      try {
        const imgData = ctx.getImageData(0, 0, 4, 4).data;
        const rValues = [];
        const gValues = [];
        const bValues = [];
        const grayValues = [];

        // Loop through the 16 pixels of the 4x4 grid
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i] / 255;
          const g = imgData[i + 1] / 255;
          const b = imgData[i + 2] / 255;
          // Calculate brightness
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          rValues.push(r);
          gValues.push(g);
          bValues.push(b);
          grayValues.push(gray);
        }

        // Combine into a 64-dimensional feature vector
        const embedding = [...rValues, ...gValues, ...bValues, ...grayValues];

        // Normalize the vector (L2 normalization) so that the dot product
        // directly equals the cosine similarity score
        const sumOfSquares = embedding.reduce((sum, val) => sum + val * val, 0);
        const norm = Math.sqrt(sumOfSquares) || 1;
        const normalizedEmbedding = embedding.map((val) => val / norm);

        // Pad to 384 dimensions to match Supabase database schema definition (vector(384))
        const paddedEmbedding = [...normalizedEmbedding, ...Array(320).fill(0)];

        resolve(paddedEmbedding);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Computes the cosine similarity between two normalized vectors.
 * Returns a score between 0 (dissimilar) and 100 (identical).
 */
export const calculateVectorSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  // Since both vectors are pre-normalized, their dot product is the cosine similarity
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  // Map similarity from [0, 1] range to [0, 100] percentage
  const mapped = Math.round(dotProduct * 100);
  return Math.max(0, Math.min(100, mapped));
};
