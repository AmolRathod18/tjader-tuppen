import imageVariants from '../config/generatedImageVariants.json';

function normalizeSource(source) {
  try {
    return new URL(source, window.location.origin).pathname;
  } catch {
    return source;
  }
}

export function getOptimizedImageUrl(source, preferredWidth = 800) {
  const variants = imageVariants[normalizeSource(source)];
  if (!variants) return source;

  const width = variants.widths.find(candidate => candidate >= preferredWidth)
    || variants.widths[variants.widths.length - 1];
  return variants.sources[width];
}
