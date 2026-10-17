import Media from "@/components/Media/Media";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import styles from "./ScaleGallery.module.css";

const HOVER_INTENT_DELAY = 140;
const RESIZE_SETTLE_DURATION = 320;

function getNaturalRatio(medium) {
  const [width, height] = String(medium?.aspect_ratio || "").split(":").map(Number);
  const ratio = medium?.width / medium?.height || width / height;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 0.8;
}

const ScaleGalleryItem = ({ entry, fallbackSubcaption, index, isMobile, sizing, onHover, onHoverLeave }) => {
  const className = [styles.container, isMobile ? styles.mobileContainer : null].filter(Boolean).join(" ");
  const naturalRatio = getNaturalRatio(entry.medium);

  return (
    <motion.div
      className={className}
      style={{ "--media-natural-ratio": naturalRatio, ...sizing }}
      onMouseMove={!isMobile ? (event) => onHover(index, event) : undefined}
      onMouseLeave={!isMobile ? onHoverLeave : undefined}
      key={entry?._key || entry?.medium?._id || index}
      initial={isMobile ? { scale: 0.8 } : false}
      whileInView={isMobile ? { scale: 1 } : undefined}
      animate={isMobile ? { scale: 0.8 } : undefined}
      viewport={{ once: false, amount: 0.45 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Media className={styles.media} medium={entry.medium} />
      <div typo="caption" className={styles.caption}>
        {entry?.medium?.caption || "Here's a placeholder caption for the media piece"}
      </div>

      <div typo="fineprint" className={styles.subcaption}>
        {entry?.medium?.subcaption || fallbackSubcaption || "Here's a placeholder caption for the media piece"}
      </div>
    </motion.div>
  );
};

const ScaleGallery = ({ block, fallbackSubcaption, isMobile = false }) => {
  const ref = useRef(null);
  const hoverIntent = useRef({ timer: null, index: null, lockedUntil: 0, x: null, y: null });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [viewport, setViewport] = useState(null);
  const media = block?.media || [];
  const className = [styles.scaleGallery, isMobile ? styles.mobileScaleGallery : null].filter(Boolean).join(" ");

  const cancelHoverIntent = () => {
    window.clearTimeout(hoverIntent.current.timer);
    hoverIntent.current.timer = null;
    hoverIntent.current.index = null;
  };

  const handleHoverIntent = (index, event) => {
    const intent = hoverIntent.current;
    const hasMoved = intent.x !== event.clientX || intent.y !== event.clientY;
    intent.x = event.clientX;
    intent.y = event.clientY;
    if (!hasMoved || performance.now() < intent.lockedUntil) return;
    if (index === hoveredIndex) {
      cancelHoverIntent();
      return;
    }
    if (intent.index === index) return;
    cancelHoverIntent();
    intent.index = index;
    intent.timer = window.setTimeout(() => {
      intent.timer = null;
      intent.index = null;
      intent.lockedUntil = performance.now() + RESIZE_SETTLE_DURATION;
      setHoveredIndex(index);
    }, HOVER_INTENT_DELAY);
  };

  useEffect(() => () => window.clearTimeout(hoverIntent.current.timer), []);

  useEffect(() => {
    if (isMobile || !media.length) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (document.documentElement.dataset.menuOverlayOpen === "true") return;

      // Only the gallery nearest the viewport centre handles keyboard navigation.
      const galleries = Array.from(document.querySelectorAll("[data-desktop-scale-gallery]"));
      const nearestGallery = galleries
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight)
        .sort((a, b) => Math.abs((a.rect.top + a.rect.bottom) / 2 - window.innerHeight / 2)
          - Math.abs((b.rect.top + b.rect.bottom) / 2 - window.innerHeight / 2))[0]?.element;
      if (nearestGallery !== ref.current) return;

      event.preventDefault();
      cancelHoverIntent();
      hoverIntent.current.lockedUntil = performance.now() + RESIZE_SETTLE_DURATION;
      setHoveredIndex((current) => {
        if (current === null) return event.key === "ArrowRight" ? 0 : media.length - 1;
        return Math.max(0, Math.min(media.length - 1, current + (event.key === "ArrowRight" ? 1 : -1)));
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, media.length]);

  useEffect(() => {
    if (isMobile) return undefined;
    const measure = () => {
      const style = getComputedStyle(ref.current);
      setViewport({
        width: ref.current.clientWidth,
        height: window.innerHeight,
        gap: parseFloat(style.columnGap) || 0,
        margin: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin")) || 0,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isMobile]);

  const availableWidth = viewport ? Math.max(1, viewport.width - viewport.gap * Math.max(0, media.length - 1)) : 0;
  const restingWidth = viewport ? Math.min(320, availableWidth / Math.max(1, media.length)) : 320;
  const hoveredRatio = getNaturalRatio(media[hoveredIndex]?.medium);
  const hoveredWidth = viewport ? Math.min(
    Math.max(1, viewport.height * 0.9 - viewport.margin * 2) * hoveredRatio,
    availableWidth * (media.length > 1 ? 0.75 : 1),
  ) : 0;
  const siblingWidth = viewport && hoveredIndex !== null && media.length > 1
    ? Math.min(restingWidth, Math.max(1, availableWidth - hoveredWidth) / (media.length - 1))
    : restingWidth;

  return (
    <div className={className} data-desktop-scale-gallery={!isMobile ? "" : undefined} ref={ref} onMouseLeave={() => {
      cancelHoverIntent();
      setHoveredIndex(null);
    }}>
      {media.map((entry, index) => (
        <ScaleGalleryItem
          entry={entry}
          fallbackSubcaption={fallbackSubcaption}
          index={index}
          isMobile={isMobile}
          onHover={handleHoverIntent}
          onHoverLeave={cancelHoverIntent}
          sizing={!isMobile && viewport ? {
            "--item-width": `${index === hoveredIndex ? hoveredWidth : siblingWidth}px`,
            "--item-height": `${index === hoveredIndex ? hoveredWidth / hoveredRatio : siblingWidth / 0.8}px`,
            "--item-resting-height": `${restingWidth / 0.8}px`,
          } : undefined}
          key={entry?._key || entry?.medium?._id || index}
        />
      ))}
    </div>
  );
};

export default ScaleGallery;
