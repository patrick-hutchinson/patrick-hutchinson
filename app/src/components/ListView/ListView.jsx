import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ListViewItem from "./ListViewItem";

import { motion } from "motion/react";

import { DeviceContext } from "@/context/DeviceContext";
import { getMediumPreviewImageUrl, getProjectThumbnailMedia, preloadImageUrl } from "@/lib/media/projectThumbnails";
import styles from "./ListView.module.css";

const BASE_HEIGHT = 64;
const ITEM_GAP = 0;
const MAX_VISUAL_SCALE = 2.6;
const MOBILE_SCALE_MULTIPLIER = 1.1;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 120;
const SCALE_FALLOFF_STRENGTH = 0.8;
const MOBILE_DISTANCE_MULTIPLIER = 0.8;
const SOLVE_PASSES = 1;
const DESKTOP_FOCUS_SMOOTHING = 0.75;
const MOBILE_FOCUS_SMOOTHING = 1;
const FOCUS_SETTLE_THRESHOLD = 0.25;
const DESKTOP_SCALE_SMOOTHING = 0.15;
const MOBILE_SCALE_SMOOTHING = 0.2;
const DESKTOP_LARGE_SCALE_INERTIA_START = 0.3;
const DESKTOP_LARGE_SCALE_SMOOTHING = 0.02;
const SCALE_SETTLE_THRESHOLD = 0.01;
const WHEEL_SCROLL_SENSITIVITY = 0.045;
const MOBILE_SCROLL_SENSITIVITY = 0.45;

const DRAG_CLICK_THRESHOLD = 6;
const DRAG_MOMENTUM_MULTIPLIER = 0.05;
const DRAG_MOMENTUM_DECAY = 0.92;
const DRAG_MOMENTUM_STOP_THRESHOLD = 0.4;

const DESKTOP_REPEAT_COUNT = 4;
const MOBILE_REPEAT_COUNT = 5;
const ACTIVE_VIDEO_COUNT = 3;
const ACTIVE_VIDEO_FOCUS_RADIUS = 150;

function getScaleFromDistance(distance, maxVisualScale, distanceMultiplier) {
  const minScaleDistance = -Math.log(MIN_SCALE / maxVisualScale) * DISTANCE_FALLOFF * distanceMultiplier;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(maxVisualScale * Math.exp((-mirroredDistance * SCALE_FALLOFF_STRENGTH) / DISTANCE_FALLOFF), MIN_SCALE);
}

function getScaleForItem(focusY, itemTop, maxVisualScale, distanceMultiplier) {
  let scale = 1;

  for (let i = 0; i < SOLVE_PASSES; i += 1) {
    const itemCenter = itemTop + (BASE_HEIGHT * scale) / 2;
    scale = getScaleFromDistance(Math.abs(focusY - itemCenter), maxVisualScale, distanceMultiplier);
  }

  return scale;
}

function getScales(focusY, listTop, itemCount, maxVisualScale, distanceMultiplier) {
  const scales = [];
  let itemTop = listTop;

  for (let index = 0; index < itemCount; index += 1) {
    const scale = getScaleForItem(focusY, itemTop, maxVisualScale, distanceMultiplier);

    scales.push(scale);
    itemTop += BASE_HEIGHT * scale + ITEM_GAP;
  }

  return scales;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getScaleSmoothing(currentScale, targetScale, maxVisualScale, isMobile) {
  if (isMobile) return MOBILE_SCALE_SMOOTHING;

  const scaleRange = Math.max(maxVisualScale - DESKTOP_LARGE_SCALE_INERTIA_START, 1);
  const largeScaleProgress = clamp(
    (Math.max(currentScale, targetScale) - DESKTOP_LARGE_SCALE_INERTIA_START) / scaleRange,
    0,
    1,
  );

  return DESKTOP_SCALE_SMOOTHING + (DESKTOP_LARGE_SCALE_SMOOTHING - DESKTOP_SCALE_SMOOTHING) * largeScaleProgress;
}

function getClosestVideoIndexes(scales, mappedArray, thumbnailMediaByProjectId, listTop, focusY) {
  if (typeof focusY !== "number") return [];

  let itemTop = listTop;

  return scales
    .map((scale, index) => {
      const center = itemTop + (BASE_HEIGHT * scale) / 2;
      const distance = Math.abs(center - focusY);

      itemTop += BASE_HEIGHT * scale + ITEM_GAP;

      return {
        distance,
        index,
        medium: thumbnailMediaByProjectId[mappedArray[index]?._id],
      };
    })
    .filter(({ distance, medium }) => distance <= ACTIVE_VIDEO_FOCUS_RADIUS && medium?.type === "video")
    .sort((a, b) => a.distance - b.distance)
    .slice(0, ACTIVE_VIDEO_COUNT)
    .map(({ index }) => index);
}

const ListView = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const animationFrame = useRef(null);
  const updateFrame = useRef(null);
  const renderedFocusY = useRef(-1000);
  const renderedScales = useRef([]);
  const targetScales = useRef([]);
  const targetFocusY = useRef(-1000);
  const wheelFocusY = useRef(null);
  const touchFocusY = useRef(null);
  const touchStartY = useRef(null);
  const dragDistance = useRef(0);
  const dragMomentumFrame = useRef(null);
  const dragVelocityY = useRef(0);
  const shouldSuppressClick = useRef(false);
  const preloadedThumbnails = useRef([]);
  const [scales, setScales] = useState([]);
  const [activeVideoIndexes, setActiveVideoIndexes] = useState([]);
  const maxVisualScale = isMobile ? MAX_VISUAL_SCALE * MOBILE_SCALE_MULTIPLIER : MAX_VISUAL_SCALE;
  const distanceMultiplier = isMobile ? MOBILE_DISTANCE_MULTIPLIER : 1;
  const focusSmoothing = isMobile ? MOBILE_FOCUS_SMOOTHING : DESKTOP_FOCUS_SMOOTHING;
  const scrollSensitivity = isMobile ? MOBILE_SCROLL_SENSITIVITY : WHEEL_SCROLL_SENSITIVITY;
  const repeatCount = isMobile ? MOBILE_REPEAT_COUNT : DESKTOP_REPEAT_COUNT;

  const mappedArray = useMemo(() => Array.from({ length: repeatCount }, () => array).flat(), [array, repeatCount]);
  const selectedMobileIndex = useMemo(() => {
    if (!isMobile || !scales.length) return null;

    return scales.reduce((selectedIndex, scale, index) => (scale > scales[selectedIndex] ? index : selectedIndex), 0);
  }, [isMobile, scales]);
  const thumbnailMediaByProjectId = useMemo(() => {
    const media = {};

    array.forEach((entry) => {
      if (entry?._type !== "project") return;

      media[entry._id] = getProjectThumbnailMedia(entry, false);
    });

    return media;
  }, [array]);
  const thumbnailUrlsByProjectId = useMemo(() => {
    const urls = {};

    array.forEach((entry) => {
      if (entry?._type !== "project") return;

      urls[entry._id] = getMediumPreviewImageUrl(thumbnailMediaByProjectId[entry._id]);
    });

    return urls;
  }, [array, thumbnailMediaByProjectId]);

  useEffect(() => {
    const uniqueUrls = [...new Set(Object.values(thumbnailUrlsByProjectId).filter(Boolean))];

    preloadedThumbnails.current = uniqueUrls.map((url) => preloadImageUrl(url)).filter(Boolean);
  }, [thumbnailUrlsByProjectId]);

  const updateActiveVideoIndexes = useCallback(
    (nextScales, listTop) => {
      if (isMobile) {
        setActiveVideoIndexes((currentIndexes) => (currentIndexes.length ? [] : currentIndexes));
        return;
      }

      const nextIndexes = getClosestVideoIndexes(
        nextScales,
        mappedArray,
        thumbnailMediaByProjectId,
        listTop,
        targetFocusY.current,
      );

      setActiveVideoIndexes((currentIndexes) => {
        if (
          currentIndexes.length === nextIndexes.length &&
          currentIndexes.every((currentIndex, index) => currentIndex === nextIndexes[index])
        ) {
          return currentIndexes;
        }

        return nextIndexes;
      });
    },
    [isMobile, mappedArray, thumbnailMediaByProjectId],
  );

  const animateScales = useCallback(() => {
    if (!containerRef.current) {
      animationFrame.current = null;
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const focusDifference = targetFocusY.current - renderedFocusY.current;
    let nextFocusY = targetFocusY.current;

    if (Math.abs(focusDifference) > FOCUS_SETTLE_THRESHOLD) {
      nextFocusY = renderedFocusY.current + focusDifference * focusSmoothing;
    }

    renderedFocusY.current = nextFocusY;
    targetScales.current = getScales(nextFocusY, rect.top, mappedArray.length, maxVisualScale, distanceMultiplier);

    const targets = targetScales.current;
    const current = renderedScales.current.length === targets.length ? renderedScales.current : targets;
    let areScalesSettled = true;

    const nextScales = targets.map((target, index) => {
      const currentScale = current[index] ?? target;
      const difference = target - currentScale;

      if (Math.abs(difference) <= SCALE_SETTLE_THRESHOLD) return target;

      areScalesSettled = false;
      return currentScale + difference * getScaleSmoothing(currentScale, target, maxVisualScale, isMobile);
    });

    renderedScales.current = nextScales;
    setScales(nextScales);
    updateActiveVideoIndexes(nextScales, rect.top);

    animationFrame.current =
      areScalesSettled && Math.abs(focusDifference) <= FOCUS_SETTLE_THRESHOLD ? null : requestAnimationFrame(animateScales);
  }, [distanceMultiplier, focusSmoothing, isMobile, mappedArray.length, maxVisualScale, updateActiveVideoIndexes]);

  const startScaleAnimation = useCallback(() => {
    if (animationFrame.current) return;

    animationFrame.current = requestAnimationFrame(animateScales);
  }, [animateScales]);

  const updateScales = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextTargetScales = getScales(
      targetFocusY.current,
      rect.top,
      mappedArray.length,
      maxVisualScale,
      distanceMultiplier,
    );

    targetScales.current = nextTargetScales;

    if (renderedScales.current.length !== nextTargetScales.length) {
      renderedFocusY.current = targetFocusY.current;
      renderedScales.current = nextTargetScales;
      setScales(nextTargetScales);
      updateActiveVideoIndexes(nextTargetScales, rect.top);
      return;
    }

    startScaleAnimation();
  }, [distanceMultiplier, mappedArray.length, maxVisualScale, startScaleAnimation, updateActiveVideoIndexes]);

  const scheduleScaleUpdate = useCallback(() => {
    if (updateFrame.current) cancelAnimationFrame(updateFrame.current);

    updateFrame.current = requestAnimationFrame(() => {
      updateFrame.current = null;
      updateScales();
    });
  }, [updateScales]);

  const updateScrollFocus = useCallback(
    (deltaY) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentFocusY =
        wheelFocusY.current ??
        touchFocusY.current ??
        (targetFocusY.current >= rect.top && targetFocusY.current <= rect.bottom
          ? targetFocusY.current
          : rect.top + rect.height / 2);
      const nextFocusY = clamp(currentFocusY + deltaY * scrollSensitivity, rect.top, rect.bottom);

      wheelFocusY.current = nextFocusY;
      touchFocusY.current = nextFocusY;
      targetFocusY.current = nextFocusY;
      scheduleScaleUpdate();
    },
    [scheduleScaleUpdate, scrollSensitivity],
  );

  const stopDragMomentum = useCallback(() => {
    if (dragMomentumFrame.current) {
      cancelAnimationFrame(dragMomentumFrame.current);
      dragMomentumFrame.current = null;
    }

    dragVelocityY.current = 0;
  }, []);

  const startDragMomentum = useCallback(() => {
    if (Math.abs(dragVelocityY.current) <= DRAG_MOMENTUM_STOP_THRESHOLD) return;

    if (dragMomentumFrame.current) cancelAnimationFrame(dragMomentumFrame.current);

    const step = () => {
      dragVelocityY.current *= DRAG_MOMENTUM_DECAY;

      if (Math.abs(dragVelocityY.current) <= DRAG_MOMENTUM_STOP_THRESHOLD) {
        dragMomentumFrame.current = null;
        dragVelocityY.current = 0;
        return;
      }

      updateScrollFocus(-dragVelocityY.current * DRAG_MOMENTUM_MULTIPLIER);
      dragMomentumFrame.current = requestAnimationFrame(step);
    };

    dragMomentumFrame.current = requestAnimationFrame(step);
  }, [updateScrollFocus]);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const initialFocusY = rect.top + rect.height / 2;

      renderedFocusY.current = initialFocusY;
      targetFocusY.current = initialFocusY;
      wheelFocusY.current = initialFocusY;
      touchFocusY.current = initialFocusY;
    }

    updateScales();
    window.addEventListener("resize", scheduleScaleUpdate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (updateFrame.current) cancelAnimationFrame(updateFrame.current);
      if (dragMomentumFrame.current) cancelAnimationFrame(dragMomentumFrame.current);
      window.removeEventListener("resize", scheduleScaleUpdate);
    };
  }, [scheduleScaleUpdate, updateScales]);

  const handleWheel = (event) => {
    event.preventDefault();
    stopDragMomentum();
    updateScrollFocus(event.deltaY);
  };

  const handleTouchStart = (event) => {
    stopDragMomentum();
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (touchStartY.current === null) return;

    event.preventDefault();

    const nextTouchY = event.touches[0]?.clientY;
    if (typeof nextTouchY !== "number") return;

    updateScrollFocus(touchStartY.current - nextTouchY);
    touchStartY.current = nextTouchY;
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  const handlePanStart = () => {
    stopDragMomentum();
    dragDistance.current = 0;
    dragVelocityY.current = 0;
    shouldSuppressClick.current = false;
  };

  const handlePan = (event, info) => {
    event.preventDefault?.();

    dragDistance.current += Math.abs(info.delta.y);
    if (dragDistance.current > DRAG_CLICK_THRESHOLD) {
      shouldSuppressClick.current = true;
    }

    dragVelocityY.current = info.velocity.y;
    updateScrollFocus(-info.delta.y);
  };

  const handlePanEnd = () => {
    dragDistance.current = 0;
    startDragMomentum();
  };

  const handleClickCapture = (event) => {
    if (!shouldSuppressClick.current) return;

    event.preventDefault();
    event.stopPropagation();
    shouldSuppressClick.current = false;
  };

  if (!array.length) return null;

  return (
    <motion.ul
      className={styles.listView}
      ref={containerRef}
      onClickCapture={handleClickCapture}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      onPanStart={handlePanStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      {mappedArray.map((entry, index) => (
        <ListViewItem
          baseHeight={BASE_HEIGHT}
          entry={entry}
          gap={ITEM_GAP}
          key={`${entry._id}-${index}`}
          maxVisualScale={maxVisualScale}
          playVideo={isMobile ? index === selectedMobileIndex : activeVideoIndexes.includes(index)}
          scale={scales[index] ?? MIN_SCALE}
          isMobile={isMobile}
          isSelected={isMobile && index === selectedMobileIndex}
          thumbnailMedium={thumbnailMediaByProjectId[entry._id]}
          thumbnailUrl={thumbnailUrlsByProjectId[entry._id]}
        />
      ))}
    </motion.ul>
  );
};

export default ListView;
