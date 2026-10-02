import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './PublicImageViewer.css';

function isViewableImage(image) {
  return Boolean(
    image &&
    image.closest('.tj-landing') &&
    !image.closest('.tj-public-image-viewer, .tj-service-lightbox, .public-nav-mark, .tj-service-image, a, [aria-hidden="true"]'),
  );
}

export default function PublicImageViewer() {
  const dialogRef = useRef(null);
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const { tp } = useLanguage();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (activeIndex !== null && !dialog.open) {
      dialog.showModal();
    } else if (activeIndex === null && dialog.open) {
      dialog.close();
    }

    if (activeIndex === null) return undefined;

    const handleNavigation = event => {
      if (event.key === 'ArrowRight') {
        setActiveIndex(index => (index + 1) % images.length);
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex(index => (index - 1 + images.length) % images.length);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
        setActiveIndex(null);
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [activeIndex, images.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const root = dialog?.closest('.tj-landing');
    if (!root) return undefined;

    const getGalleryImages = () =>
      [...root.querySelectorAll('img')]
        .filter(isViewableImage)
        .map(image => ({
          src: image.currentSrc || image.src,
          alt: image.alt || tp('Tjädertuppen work photo'),
        }));

    const openImage = image => {
      if (!isViewableImage(image)) return;

      const galleryImages = getGalleryImages();
      const imageIndex = [...root.querySelectorAll('img')]
        .filter(isViewableImage)
        .indexOf(image);
      if (imageIndex < 0) return;

      setImages(galleryImages);
      setActiveIndex(imageIndex);
    };

    const handleClick = event => {
      const image = event.target instanceof Element ? event.target.closest('img') : null;
      if (!image || !isViewableImage(image)) return;

      event.preventDefault();
      event.stopPropagation();
      openImage(image);
    };

    const handleKeyDown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const image = event.target instanceof HTMLImageElement ? event.target : null;
      if (!image || !isViewableImage(image)) return;

      event.preventDefault();
      openImage(image);
    };

    const makeImagesAccessible = () => {
      root.querySelectorAll('img').forEach(image => {
        if (!isViewableImage(image)) return;
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-label', tp(`View image: ${image.alt || 'Tjädertuppen work photo'}`));
        image.classList.add('tj-public-image-viewer-trigger');
      });
    };

    makeImagesAccessible();
    root.addEventListener('click', handleClick);
    root.addEventListener('keydown', handleKeyDown);

    const observer = new MutationObserver(makeImagesAccessible);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeyDown);
      root.querySelectorAll('.tj-public-image-viewer-trigger').forEach(image => {
        image.removeAttribute('tabindex');
        image.removeAttribute('role');
        image.removeAttribute('aria-label');
        image.classList.remove('tj-public-image-viewer-trigger');
      });
    };
  }, [tp]);

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <dialog
      className="tj-public-image-viewer"
      ref={dialogRef}
      aria-label={tp('Image gallery')}
      onClose={() => setActiveIndex(null)}
      onCancel={() => setActiveIndex(null)}
      onClick={event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      {activeImage && (
        <div className="tj-public-image-viewer-content">
          <div
            className="tj-public-image-viewer-stage"
            style={{ '--viewer-photo': `url("${activeImage.src}")` }}
          >
            <img src={activeImage.src} alt={activeImage.alt} />
            <button
              className="tj-public-image-viewer-navigation is-previous"
              type="button"
              onClick={() => setActiveIndex(index => (index - 1 + images.length) % images.length)}
              aria-label={tp('Previous image')}
            >
              <ArrowLeft size={22} />
            </button>
            <button
              className="tj-public-image-viewer-navigation is-next"
              type="button"
              onClick={() => setActiveIndex(index => (index + 1) % images.length)}
              aria-label={tp('Next image')}
            >
              <ArrowRight size={22} />
            </button>
          </div>
          <div className="tj-public-image-viewer-caption">
            <p>{activeImage.alt}</p>
            <span>{String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
          </div>
          <button
            className="tj-public-image-viewer-close"
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={tp('Close image gallery')}
          >
            <X size={22} />
          </button>
        </div>
      )}
    </dialog>
  );
}
