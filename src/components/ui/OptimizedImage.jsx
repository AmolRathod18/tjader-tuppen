import React from 'react';
import imageVariants from '../../config/generatedImageVariants.json';

export default function OptimizedImage({
  src,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  sizes = '(max-width: 700px) 100vw, 50vw',
  fetchPriority,
  ...imageProps
}) {
  let normalizedSrc = src;
  try {
    normalizedSrc = new URL(src, window.location.origin).pathname;
  } catch {
    normalizedSrc = src;
  }
  const variants = imageVariants[normalizedSrc];
  const sharedProps = {
    ...imageProps,
    src,
    alt,
    loading,
    decoding,
    ...(fetchPriority ? { fetchPriority } : {}),
    'data-original-src': src,
    ...(variants ? { width: variants.width, height: variants.height } : {}),
  };

  if (!variants) return <img {...sharedProps} />;

  const srcSet = variants.widths
    .map(width => `${variants.sources[width]} ${width}w`)
    .join(', ');

  return (
    <picture style={{ display: 'block', width: '100%', height: '100%' }}>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img {...sharedProps} srcSet={undefined} sizes={undefined} />
    </picture>
  );
}
