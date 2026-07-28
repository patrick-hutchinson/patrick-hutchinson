import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion } from "motion/react";

import { DeviceContext } from "@/context/DeviceContext";
import { getMediumPreviewImageUrl, getProjectThumbnailMedia, preloadImageUrl } from "@/lib/media/projectThumbnails";
import styles from "./ScaleList.module.css";

const BASE_HEIGHT = 64;
const MAX_VISUAL_SCALE = 2.2;
const MOBILE_SCALE_MULTIPLIER = 0.33;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 100;
const MOBILE_DISTANCE_MULTIPLIER = 1.2;
const SOLVE_PASSES = 8;
const VIRTUAL_SCROLL_SMOOTHING = 1;
const VIRTUAL_SCROLL_SETTLE_THRESHOLD = 0.25;
const SCALE_SMOOTHING = 0.2;
const SCALE_SETTLE_THRESHOLD = 0.002;
const TRACKPAD_SENSITIVITY = 0.05;
const MOBILE_TRACKPAD_SENSITIVITY = 0.45;
const DRAG_RESISTANCE = 10;
const DRAG_INERTIA = 0.92;
const DRAG_INERTIA_STOP_VELOCITY = 0.01;
const DRAG_CLICK_THRESHOLD = 4;
const DESKTOP_REPEAT_COUNT = 8;
const MOBILE_REPEAT_COUNT = 30;
const ACTIVE_VIDEO_COUNT = 6;
const ACTIVE_VIDEO_SCALE_THRESHOLD = MIN_SCALE + 0.001;

function getScaleFromDistance(distance, maxVisualScale, distanceMultiplier) {
  const minScaleDistance = -Math.log(MIN_SCALE / maxVisualScale) * DISTANCE_FALLOFF * distanceMultiplier;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(maxVisualScale * Math.exp(-mirroredDistance / DISTANCE_FALLOFF), MIN_SCALE);
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
    itemTop += BASE_HEIGHT * scale;
  }

  return scales;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getClosestVideoIndexes(scales, mappedArray, thumbnailMediaByProjectId) {
  return scales
    .map((scale, index) => ({ index, scale, medium: thumbnailMediaByProjectId[mappedArray[index]?._id] }))
    .filter(({ scale, medium }) => scale > ACTIVE_VIDEO_SCALE_THRESHOLD && medium?.type === "video")
    .sort((a, b) => b.scale - a.scale)
    .slice(0, ACTIVE_VIDEO_COUNT)
    .map(({ index }) => index);
}

const ScaleList = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const animationFrame = useRef(null);
  const dragInertiaFrame = useRef(null);
  const updateFrame = useRef(null);
  const dragState = useRef(null);
  const renderedVirtualY = useRef(null);
  const renderedScales = useRef([]);
  const targetScales = useRef([]);
  const scrollVirtualY = useRef(null);
  const targetVirtualY = useRef(null);
  const touchVirtualY = useRef(null);
  const touchStartY = useRef(null);
  const preloadedThumbnails = useRef([]);
  const suppressNextClick = useRef(false);
  const [scales, setScales] = useState([]);
  const [activeVideoIndexes, setActiveVideoIndexes] = useState([]);
  const maxVisualScale = isMobile ? MAX_VISUAL_SCALE * MOBILE_SCALE_MULTIPLIER : MAX_VISUAL_SCALE;
  const distanceMultiplier = isMobile ? MOBILE_DISTANCE_MULTIPLIER : 1;
  const trackpadSensitivity = isMobile ? MOBILE_TRACKPAD_SENSITIVITY : TRACKPAD_SENSITIVITY;
  const repeatCount = isMobile ? MOBILE_REPEAT_COUNT : DESKTOP_REPEAT_COUNT;

  const mappedArray = useMemo(() => Array.from({ length: repeatCount }, () => array).flat(), [array, repeatCount]);
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
    (nextScales) => {
      const nextIndexes = getClosestVideoIndexes(nextScales, mappedArray, thumbnailMediaByProjectId);

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
    [mappedArray, thumbnailMediaByProjectId],
  );

  const animateScales = useCallback(() => {
    if (!containerRef.current) {
      animationFrame.current = null;
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const targetY = targetVirtualY.current ?? rect.top + rect.height / 2;
    const renderedY = renderedVirtualY.current ?? targetY;
    const virtualDifference = targetY - renderedY;
    let nextVirtualY = targetY;

    if (Math.abs(virtualDifference) > VIRTUAL_SCROLL_SETTLE_THRESHOLD) {
      nextVirtualY = renderedY + virtualDifference * VIRTUAL_SCROLL_SMOOTHING;
    }

    renderedVirtualY.current = nextVirtualY;
    targetScales.current = getScales(nextVirtualY, rect.top, mappedArray.length, maxVisualScale, distanceMultiplier);

    const targets = targetScales.current;
    const current = renderedScales.current.length === targets.length ? renderedScales.current : targets;
    let areScalesSettled = true;

    const nextScales = targets.map((target, index) => {
      const currentScale = current[index] ?? target;
      const difference = target - currentScale;

      if (Math.abs(difference) <= SCALE_SETTLE_THRESHOLD) return target;

      areScalesSettled = false;
      return currentScale + difference * SCALE_SMOOTHING;
    });

    renderedScales.current = nextScales;
    setScales(nextScales);
    updateActiveVideoIndexes(nextScales);

    animationFrame.current =
      areScalesSettled && Math.abs(virtualDifference) <= VIRTUAL_SCROLL_SETTLE_THRESHOLD
        ? null
        : requestAnimationFrame(animateScales);
  }, [distanceMultiplier, mappedArray.length, maxVisualScale, updateActiveVideoIndexes]);

  const startScaleAnimation = useCallback(() => {
    if (animationFrame.current) return;

    animationFrame.current = requestAnimationFrame(animateScales);
  }, [animateScales]);

  const updateScales = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const targetY = targetVirtualY.current ?? rect.top + rect.height / 2;
    const nextTargetScales = getScales(targetY, rect.top, mappedArray.length, maxVisualScale, distanceMultiplier);

    targetScales.current = nextTargetScales;

    if (renderedScales.current.length !== nextTargetScales.length) {
      targetVirtualY.current = targetY;
      scrollVirtualY.current = targetY;
      renderedVirtualY.current = targetY;
      renderedScales.current = nextTargetScales;
      setScales(nextTargetScales);
      updateActiveVideoIndexes(nextTargetScales);
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

  const cancelDragInertia = useCallback(() => {
    if (!dragInertiaFrame.current) return;

    cancelAnimationFrame(dragInertiaFrame.current);
    dragInertiaFrame.current = null;
  }, []);

  const updateVirtualScrollPosition = useCallback(
    (deltaY, sensitivity = trackpadSensitivity) => {
      if (!containerRef.current) return false;

      const rect = containerRef.current.getBoundingClientRect();
      const currentVirtualY =
        scrollVirtualY.current ??
        touchVirtualY.current ??
        (targetVirtualY.current !== null && targetVirtualY.current >= rect.top && targetVirtualY.current <= rect.bottom
          ? targetVirtualY.current
          : rect.top + rect.height / 2);
      const nextVirtualY = clamp(currentVirtualY + deltaY * sensitivity, rect.top, rect.bottom);

      scrollVirtualY.current = nextVirtualY;
      touchVirtualY.current = nextVirtualY;
      targetVirtualY.current = nextVirtualY;
      scheduleScaleUpdate();

      return nextVirtualY !== currentVirtualY;
    },
    [scheduleScaleUpdate, trackpadSensitivity],
  );

  const handleWheel = useCallback(
    (event) => {
      cancelDragInertia();
      event.preventDefault();
      updateVirtualScrollPosition(event.deltaY);
    },
    [cancelDragInertia, updateVirtualScrollPosition],
  );

  const handleTouchStart = useCallback(
    (event) => {
      cancelDragInertia();
      touchStartY.current = event.touches[0]?.clientY ?? null;
    },
    [cancelDragInertia],
  );

  const handleTouchMove = useCallback(
    (event) => {
      if (touchStartY.current === null) return;

      event.preventDefault();

      const nextTouchY = event.touches[0]?.clientY;
      if (typeof nextTouchY !== "number") return;

      updateVirtualScrollPosition(touchStartY.current - nextTouchY);
      touchStartY.current = nextTouchY;
    },
    [updateVirtualScrollPosition],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
  }, []);

  const startDragInertia = useCallback(
    (initialVelocity) => {
      let velocity = initialVelocity;

      const animateDragInertia = () => {
        velocity *= DRAG_INERTIA;

        if (Math.abs(velocity) <= DRAG_INERTIA_STOP_VELOCITY) {
          dragInertiaFrame.current = null;
          return;
        }

        const moved = updateVirtualScrollPosition(velocity, 1 / DRAG_RESISTANCE);

        if (!moved) {
          dragInertiaFrame.current = null;
          return;
        }

        dragInertiaFrame.current = requestAnimationFrame(animateDragInertia);
      };

      cancelDragInertia();

      if (Math.abs(velocity) > DRAG_INERTIA_STOP_VELOCITY) {
        dragInertiaFrame.current = requestAnimationFrame(animateDragInertia);
      }
    },
    [cancelDragInertia, updateVirtualScrollPosition],
  );

  const handleDragPointerDown = useCallback(
    (event) => {
      if (event.pointerType === "touch" || event.button !== 0) return;

      cancelDragInertia();
      dragState.current = {
        hasDragged: false,
        lastTime: event.timeStamp,
        lastY: event.clientY,
        pointerId: event.pointerId,
        startY: event.clientY,
        velocity: 0,
      };
    },
    [cancelDragInertia],
  );

  const handleDragPointerMove = useCallback(
    (event) => {
      const drag = dragState.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      const totalDistance = Math.abs(event.clientY - drag.startY);
      const deltaY = drag.lastY - event.clientY;
      const elapsed = Math.max(event.timeStamp - drag.lastTime, 1);

      if (totalDistance > DRAG_CLICK_THRESHOLD) {
        drag.hasDragged = true;
      }

      if (drag.hasDragged) {
        event.preventDefault();
        updateVirtualScrollPosition(deltaY, 1 / DRAG_RESISTANCE);
      }

      drag.velocity = (deltaY / elapsed) * 16.67;
      drag.lastY = event.clientY;
      drag.lastTime = event.timeStamp;
    },
    [updateVirtualScrollPosition],
  );

  const handleDragPointerEnd = useCallback(
    (event) => {
      const drag = dragState.current;

      if (!drag || drag.pointerId !== event.pointerId) return;

      dragState.current = null;

      if (!drag.hasDragged) return;

      suppressNextClick.current = true;
      window.setTimeout(() => {
        suppressNextClick.current = false;
      }, 120);
      startDragInertia(drag.velocity);
    },
    [startDragInertia],
  );

  const handleClickCapture = useCallback((event) => {
    if (!suppressNextClick.current) return;

    suppressNextClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleNativeDragStart = useCallback((event) => {
    event.preventDefault();
  }, []);

  useEffect(() => {
    const element = containerRef.current;

    updateScales();
    window.addEventListener("resize", scheduleScaleUpdate);
    element?.addEventListener("wheel", handleWheel, { passive: false });
    element?.addEventListener("touchmove", handleTouchMove, { passive: false });
    element?.addEventListener("dragstart", handleNativeDragStart, { capture: true });
    element?.addEventListener("pointerdown", handleDragPointerDown, { capture: true });
    window.addEventListener("pointermove", handleDragPointerMove, { capture: true });
    window.addEventListener("pointerup", handleDragPointerEnd, { capture: true });
    window.addEventListener("pointercancel", handleDragPointerEnd, { capture: true });

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (dragInertiaFrame.current) cancelAnimationFrame(dragInertiaFrame.current);
      if (updateFrame.current) cancelAnimationFrame(updateFrame.current);
      window.removeEventListener("resize", scheduleScaleUpdate);
      element?.removeEventListener("wheel", handleWheel);
      element?.removeEventListener("touchmove", handleTouchMove);
      element?.removeEventListener("dragstart", handleNativeDragStart, { capture: true });
      element?.removeEventListener("pointerdown", handleDragPointerDown, { capture: true });
      window.removeEventListener("pointermove", handleDragPointerMove, { capture: true });
      window.removeEventListener("pointerup", handleDragPointerEnd, { capture: true });
      window.removeEventListener("pointercancel", handleDragPointerEnd, { capture: true });
    };
  }, [
    handleDragPointerDown,
    handleDragPointerEnd,
    handleDragPointerMove,
    handleNativeDragStart,
    handleTouchMove,
    handleWheel,
    scheduleScaleUpdate,
    updateScales,
  ]);

  if (!array.length) return null;

  return (
    <motion.ul
      className={styles.scaleList}
      ref={containerRef}
      onClickCapture={handleClickCapture}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
    >
      {mappedArray.map((entry, index) => (
        <ScaleListItem
          baseHeight={BASE_HEIGHT}
          entry={entry}
          key={`${entry._id}-${index}`}
          maxVisualScale={maxVisualScale}
          playVideo={activeVideoIndexes.includes(index)}
          scale={scales[index] ?? MIN_SCALE}
          thumbnailMedium={thumbnailMediaByProjectId[entry._id]}
          thumbnailUrl={thumbnailUrlsByProjectId[entry._id]}
        />
      ))}
    </motion.ul>
  );
};

export default ScaleList;
