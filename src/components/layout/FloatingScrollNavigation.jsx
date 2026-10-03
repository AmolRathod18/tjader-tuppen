import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const VIEWPORT_MARGIN = 12;
const CONTROL_BORDER = 2;
const INTERACTIVE_SELECTOR = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [contenteditable="true"], form, dialog[open], [role="dialog"], [aria-modal="true"], [role="alert"], [role="status"]';

function getControlMetrics() {
  const compact = window.matchMedia('(max-width: 640px)').matches;
  return {
    size: compact ? 24 : 30,
    gap: 1,
    padding: compact ? 2 : 3,
  };
}

function getScrollTarget() {
  const pageContent = document.querySelector('.page-content');
  if (pageContent && pageContent.scrollHeight > pageContent.clientHeight + 1) return pageContent;
  return document.scrollingElement ?? document.documentElement;
}

function getScrollMetrics(target) {
  const isDocument = target === document.scrollingElement;
  const viewportHeight = isDocument ? window.innerHeight : target.clientHeight;
  return {
    isDocument,
    current: isDocument ? window.scrollY : target.scrollTop,
    max: Math.max(0, target.scrollHeight - (isDocument ? viewportHeight : target.clientHeight)),
    viewportHeight,
  };
}

function getHeaderOffset(container) {
  const containerTop = container === document.scrollingElement
    ? 0
    : container.getBoundingClientRect().top + container.clientTop;
  let offset = 0;

  document.querySelectorAll('header').forEach(header => {
    const style = window.getComputedStyle(header);
    if (style.position !== 'fixed' && style.position !== 'sticky') return;
    const rect = header.getBoundingClientRect();
    if (rect.top <= containerTop + 1 && rect.bottom > containerTop) {
      offset = Math.max(offset, rect.bottom - containerTop);
    }
  });

  return offset;
}

function getImportantRects() {
  const visible = element => {
    for (let current = element; current; current = current.parentElement) {
      const style = window.getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    return true;
  };
  const rects = [];
  const modal = document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"], .tj-public-image-viewer');

  if (modal && visible(modal) && modal.getBoundingClientRect().width > 0) return null;

  document.querySelectorAll(INTERACTIVE_SELECTOR).forEach(element => {
    if (element.closest('.site-scroll-navigation') || !visible(element)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) rects.push(rect);
  });

  document.querySelectorAll('.tj-hero-content').forEach(element => {
    if (!visible(element)) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) rects.push(rect);
  });

  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (textWalker.nextNode()) {
    const textNode = textWalker.currentNode;
    const parent = textNode.parentElement;
    if (!parent || !textNode.nodeValue.trim() || parent.closest('.site-scroll-navigation') || !visible(parent)) continue;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    rects.push(...range.getClientRects());
  }

  return rects;
}

function overlapsImportantContent(candidate, rects) {
  if (!rects) return true;
  const buffer = 5;
  return rects.some(rect => (
    candidate.left < rect.right + buffer
    && candidate.right > rect.left - buffer
    && candidate.top < rect.bottom + buffer
    && candidate.bottom > rect.top - buffer
  ));
}

function findSafePosition(currentPosition) {
  if (window.matchMedia('(max-width: 640px)').matches) {
    const heroCard = document.querySelector('.tj-hero-content');
    if (heroCard) {
      const rect = heroCard.getBoundingClientRect();
      if (rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight) return null;
    }
  }

  const layouts = window.innerHeight < 130 ? [true] : [false, true];
  const { size, gap, padding } = getControlMetrics();
  const rects = getImportantRects();
  const isSafe = (position, horizontal, width, height) => {
    const candidate = {
      left: position.x,
      right: position.x + width,
      top: position.y,
      bottom: position.y + height,
    };
    return position.horizontal === horizontal
      && candidate.left >= 0
      && candidate.top >= 0
      && candidate.right <= window.innerWidth
      && candidate.bottom <= window.innerHeight
      && !overlapsImportantContent(candidate, rects);
  };

  if (!rects) return null;

  for (const horizontal of layouts) {
    const width = horizontal
      ? size * 2 + gap + padding * 2 + CONTROL_BORDER
      : size + padding * 2 + CONTROL_BORDER;
    const height = horizontal
      ? size + padding * 2 + CONTROL_BORDER
      : size * 2 + gap + padding * 2 + CONTROL_BORDER;
    const rightEdge = window.innerWidth - width - VIEWPORT_MARGIN;
    const bottom = window.innerHeight - height - VIEWPORT_MARGIN;
    const top = VIEWPORT_MARGIN;

    if (currentPosition?.horizontal === horizontal
      && currentPosition.x === rightEdge
      && isSafe(currentPosition, horizontal, width, height)) {
      return currentPosition;
    }

    const step = Math.max(8, Math.floor(size / 4));
    for (let y = bottom; y >= top; y -= step) {
      const position = { x: rightEdge, y, horizontal };
      if (isSafe(position, horizontal, width, height)) return position;
    }
  }

  return null;
}

function scrollTo(target, position) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  if (target === document.scrollingElement) {
    window.scrollTo({ top: position, left: 0, behavior });
  } else {
    target.scrollTo({ top: position, left: 0, behavior });
  }
}

export default function FloatingScrollNavigation() {
  const location = useLocation();
  const { t } = useLanguage();
  const [position, setPosition] = useState(null);
  const [scrollState, setScrollState] = useState({ current: 0, max: 0 });

  const updatePosition = useCallback(() => {
    const target = getScrollTarget();
    const metrics = getScrollMetrics(target);
    setScrollState(previous => (
      previous.current === metrics.current && previous.max === metrics.max
        ? previous
        : { current: metrics.current, max: metrics.max }
    ));
    setPosition(previous => {
      const next = findSafePosition(previous);
      if (previous?.x === next?.x && previous?.y === next?.y && previous?.horizontal === next?.horizontal) {
        return previous;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updatePosition();
      });
    };

    const target = getScrollTarget();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    target.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(document.body);

    const mutationObserver = new MutationObserver(scheduleUpdate);
    mutationObserver.observe(document.body, { childList: true, characterData: true, subtree: true });

    scheduleUpdate();
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      target.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search, location.hash, updatePosition]);

  const scrollToTop = () => {
    const target = getScrollTarget();
    scrollTo(target, 0);
  };

  const scrollDown = () => {
    const target = getScrollTarget();
    const metrics = getScrollMetrics(target);
    const containerTop = metrics.isDocument ? 0 : target.getBoundingClientRect().top + target.clientTop;
    const headerOffset = getHeaderOffset(target);
    const anchor = metrics.current + headerOffset;
    const scope = metrics.isDocument ? document : target;
    const sections = [...scope.querySelectorAll('main section, main [data-scroll-section]')].map(section => {
      const rect = section.getBoundingClientRect();
      const top = metrics.current + rect.top - containerTop;
      return { top, bottom: top + rect.height };
    });
    const activeIndex = sections.findIndex(section => section.top <= anchor && section.bottom > anchor);
    const nextSection = sections[activeIndex + 1] ?? sections.find(section => section.top > anchor);
    let nextPosition = nextSection ? nextSection.top - headerOffset : metrics.current + metrics.viewportHeight * 0.85;

    if (nextPosition <= metrics.current + 8) {
      nextPosition = metrics.current + metrics.viewportHeight * 0.85;
    }
    scrollTo(target, Math.min(metrics.max, nextPosition));
  };

  if (!position) return null;

  return (
    <div
      className="site-scroll-navigation"
      data-layout={position.horizontal ? 'horizontal' : 'vertical'}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="group"
      aria-label={t('ui_scroll_navigation')}
    >
      <button
        type="button"
        onClick={scrollToTop}
        disabled={scrollState.current <= 1}
        aria-label={t('ui_scroll_top')}
        title={t('ui_scroll_top')}
      >
        <ArrowUp size={19} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={scrollDown}
        disabled={scrollState.current >= scrollState.max - 1}
        aria-label={t('ui_scroll_down')}
        title={t('ui_scroll_down')}
      >
        <ArrowDown size={19} aria-hidden="true" />
      </button>
    </div>
  );
}
