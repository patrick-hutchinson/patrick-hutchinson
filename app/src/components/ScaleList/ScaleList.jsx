import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion } from "motion/react";
import { useRouter } from "next/router";

import { DeviceContext } from "@/context/DeviceContext";
import { getMediumPreviewImageUrl, getProjectThumbnailMedia, preloadImageUrl } from "@/lib/media/projectThumbnails";
import styles from "./ScaleList.module.css";

const BASE_HEIGHT = 64;
const ITEM_GAP = 0;
const MAX_VISUAL_SCALE = 2.5;
const MOBILE_SCALE_MULTIPLIER = 1.1;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 120;
const SCALE_FALLOFF_STRENGTH = 0.85;
const MOBILE_DISTANCE_MULTIPLIER = 0.8;
const SOLVE_PASSES = 8;
const DESKTOP_CURSOR_SENSITIVITY = 1;
const DESKTOP_POINTER_SMOOTHING = 0.75;
const MOBILE_POINTER_SMOOTHING = 1;
const POINTER_SETTLE_THRESHOLD = 0.25;
const DESKTOP_SCALE_SMOOTHING = 0.15;
const MOBILE_SCALE_SMOOTHING = 0.2;
const DESKTOP_LARGE_SCALE_INERTIA_START = 0.3;
const DESKTOP_LARGE_SCALE_SMOOTHING = 0.02;
const SCALE_SETTLE_THRESHOLD = 0.01;
const TRACKPAD_SENSITIVITY = 0.025;
const MOBILE_TRACKPAD_SENSITIVITY = 0.45;
const DESKTOP_REPEAT_COUNT = 8;
const MOBILE_REPEAT_COUNT = 5;
const ACTIVE_VIDEO_COUNT = 3;
const ACTIVE_VIDEO_CURSOR_RADIUS = 220;

function getScaleFromDistance(distance, maxVisualScale, distanceMultiplier) {
  const minScaleDistance = -Math.log(MIN_SCALE / maxVisualScale) * DISTANCE_FALLOFF * distanceMultiplier;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(maxVisualScale * Math.exp((-mirroredDistance * SCALE_FALLOFF_STRENGTH) / DISTANCE_FALLOFF), MIN_SCALE);
}

function getScaleForItem(cursorY, itemTop, maxVisualScale, distanceMultiplier) {
  let scale = 1;

  for (let i = 0; i < SOLVE_PASSES; i += 1) {
    const itemCenter = itemTop + (BASE_HEIGHT * scale) / 2;
    scale = getScaleFromDistance(Math.abs(cursorY - itemCenter), maxVisualScale, distanceMultiplier);
  }

  return scale;
}

function getScales(cursorY, listTop, itemCount, maxVisualScale, distanceMultiplier) {
  const scales = [];
  let itemTop = listTop;

  for (let index = 0; index < itemCount; index += 1) {
    const scale = getScaleForItem(cursorY, itemTop, maxVisualScale, distanceMultiplier);

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

function getClosestVideoIndexes(scales, mappedArray, thumbnailMediaByProjectId, isPointerActive, listTop, cursorY) {
  if (!isPointerActive || typeof cursorY !== "number") return [];

  let itemTop = listTop;

  return scales
    .map((scale, index) => {
      const center = itemTop + (BASE_HEIGHT * scale) / 2;
      const distance = Math.abs(center - cursorY);

      itemTop += BASE_HEIGHT * scale + ITEM_GAP;

      return {
        distance,
        index,
        medium: thumbnailMediaByProjectId[mappedArray[index]?._id],
      };
    })
    .filter(({ distance, medium }) => distance <= ACTIVE_VIDEO_CURSOR_RADIUS && medium?.type === "video")
    .sort((a, b) => a.distance - b.distance)
    .slice(0, ACTIVE_VIDEO_COUNT)
    .map(({ index }) => index);
}

function getLargestScaledProjectIndex(scales, mappedArray) {
  if (!scales.length) return null;

  return scales.reduce((selectedIndex, scale, index) => {
    if (mappedArray[index]?._type !== "project") return selectedIndex;
    if (selectedIndex === null) return index;

    return scale > scales[selectedIndex] ? index : selectedIndex;
  }, null);
}

const ScaleList = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const router = useRouter();
  const containerRef = useRef(null);
  const animationFrame = useRef(null);
  const updateFrame = useRef(null);
  const renderedPointerY = useRef(-1000);
  const renderedScales = useRef([]);
  const targetScales = useRef([]);
  const targetPointerY = useRef(-1000);
  const lastCursorY = useRef(null);
  const trackpadPointerY = useRef(null);
  const touchPointerY = useRef(null);
  const touchStartY = useRef(null);
  const preloadedThumbnails = useRef([]);
  const isPointerActive = useRef(false);
  const isWindowFocused = useRef(true);
  const [scales, setScales] = useState([]);
  const [activeVideoIndexes, setActiveVideoIndexes] = useState([]);
  const maxVisualScale = isMobile ? MAX_VISUAL_SCALE * MOBILE_SCALE_MULTIPLIER : MAX_VISUAL_SCALE;
  const distanceMultiplier = isMobile ? MOBILE_DISTANCE_MULTIPLIER : 1;
  const pointerSmoothing = isMobile ? MOBILE_POINTER_SMOOTHING : DESKTOP_POINTER_SMOOTHING;
  const trackpadSensitivity = isMobile ? MOBILE_TRACKPAD_SENSITIVITY : TRACKPAD_SENSITIVITY;
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
        isPointerActive.current,
        listTop,
        lastCursorY.current,
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
    const pointerDifference = targetPointerY.current - renderedPointerY.current;
    let nextPointerY = targetPointerY.current;

    if (Math.abs(pointerDifference) > POINTER_SETTLE_THRESHOLD) {
      nextPointerY = renderedPointerY.current + pointerDifference * pointerSmoothing;
    }

    renderedPointerY.current = nextPointerY;
    targetScales.current = getScales(nextPointerY, rect.top, mappedArray.length, maxVisualScale, distanceMultiplier);

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
      areScalesSettled && Math.abs(pointerDifference) <= POINTER_SETTLE_THRESHOLD
        ? null
        : requestAnimationFrame(animateScales);
  }, [distanceMultiplier, isMobile, mappedArray.length, maxVisualScale, pointerSmoothing, updateActiveVideoIndexes]);

  const startScaleAnimation = useCallback(() => {
    if (animationFrame.current) return;

    animationFrame.current = requestAnimationFrame(animateScales);
  }, [animateScales]);

  const updateScales = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextTargetScales = getScales(
      targetPointerY.current,
      rect.top,
      mappedArray.length,
      maxVisualScale,
      distanceMultiplier,
    );

    targetScales.current = nextTargetScales;

    if (renderedScales.current.length !== nextTargetScales.length) {
      renderedPointerY.current = targetPointerY.current;
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

  const updateVirtualPointer = useCallback(
    (deltaY) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentPointerY =
        trackpadPointerY.current ??
        touchPointerY.current ??
        (targetPointerY.current >= rect.top && targetPointerY.current <= rect.bottom
          ? targetPointerY.current
          : rect.top + rect.height / 2);
      const nextPointerY = clamp(currentPointerY + deltaY * trackpadSensitivity, rect.top, rect.bottom);

      trackpadPointerY.current = nextPointerY;
      touchPointerY.current = nextPointerY;
      isPointerActive.current = true;
      targetPointerY.current = nextPointerY;
      scheduleScaleUpdate();
    },
    [scheduleScaleUpdate, trackpadSensitivity],
  );

  useEffect(() => {
    const handleWindowBlur = () => {
      isWindowFocused.current = false;
    };

    const handleWindowFocus = () => {
      isWindowFocused.current = true;
    };

    const handleVisibilityChange = () => {
      isWindowFocused.current = document.visibilityState === "visible" && document.hasFocus();
    };

    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = event.clientX;
      const cursorY = event.clientY;
      const isInsideScaleList =
        cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom;

      if (!isInsideScaleList) {
        trackpadPointerY.current = null;
        touchPointerY.current = null;
        lastCursorY.current = null;
        isPointerActive.current = false;
        setActiveVideoIndexes([]);

        if (isWindowFocused.current && document.visibilityState === "visible" && document.hasFocus()) {
          targetPointerY.current = -1000;
          scheduleScaleUpdate();
        }

        return;
      }

      const currentPointerY =
        targetPointerY.current >= rect.top && targetPointerY.current <= rect.bottom ? targetPointerY.current : cursorY;
      const cursorDelta = lastCursorY.current === null ? 0 : cursorY - lastCursorY.current;
      const nextPointerY =
        lastCursorY.current === null
          ? cursorY
          : clamp(currentPointerY + cursorDelta * DESKTOP_CURSOR_SENSITIVITY, rect.top, rect.bottom);

      lastCursorY.current = cursorY;
      trackpadPointerY.current = null;
      touchPointerY.current = null;
      isPointerActive.current = true;
      targetPointerY.current = nextPointerY;
      scheduleScaleUpdate();
    };

    isWindowFocused.current = document.visibilityState === "visible" && document.hasFocus();
    updateScales();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", scheduleScaleUpdate);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (updateFrame.current) cancelAnimationFrame(updateFrame.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", scheduleScaleUpdate);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [scheduleScaleUpdate, updateScales]);

  const handleWheel = (event) => {
    event.preventDefault();
    updateVirtualPointer(event.deltaY);
  };

  const handleClick = (event) => {
    if (isMobile) return;

    event.preventDefault();

    const currentScales = renderedScales.current.length === mappedArray.length ? renderedScales.current : scales;
    const selectedIndex = getLargestScaledProjectIndex(currentScales, mappedArray);
    const selectedEntry = selectedIndex === null ? null : mappedArray[selectedIndex];

    if (selectedEntry?._type !== "project" || !selectedEntry.slug?.current) return;

    router.push(`/projects/${selectedEntry.slug.current}`, undefined, { scroll: false });
  };

  const handleTouchStart = (event) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (touchStartY.current === null) return;

    event.preventDefault();

    const nextTouchY = event.touches[0]?.clientY;
    if (typeof nextTouchY !== "number") return;

    updateVirtualPointer(touchStartY.current - nextTouchY);
    touchStartY.current = nextTouchY;
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  if (!array.length) return null;

  return (
    <motion.ul
      className={styles.scaleList}
      ref={containerRef}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {mappedArray.map((entry, index) => (
        <ScaleListItem
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

export default ScaleList;
