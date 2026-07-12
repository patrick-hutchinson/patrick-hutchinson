import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion } from "motion/react";

import { DeviceContext } from "@/context/DeviceContext";
import styles from "./ScaleList.module.css";

const BASE_HEIGHT = 64;
const MAX_VISUAL_SCALE = 2.2;
const MOBILE_SCALE_MULTIPLIER = 0.33;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 100;
const MOBILE_DISTANCE_MULTIPLIER = 1.2;
const SOLVE_PASSES = 8;
const POINTER_SMOOTHING = 1;
const POINTER_SETTLE_THRESHOLD = 0.25;
const SCALE_SMOOTHING = 0.2;
const SCALE_SETTLE_THRESHOLD = 0.002;
const TRACKPAD_SENSITIVITY = 1;
const MOBILE_TRACKPAD_SENSITIVITY = 0.45;
const DESKTOP_REPEAT_COUNT = 10;
const MOBILE_REPEAT_COUNT = 30;

function getScaleFromDistance(distance, maxVisualScale, distanceMultiplier) {
  const minScaleDistance = -Math.log(MIN_SCALE / maxVisualScale) * DISTANCE_FALLOFF * distanceMultiplier;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(maxVisualScale * Math.exp(-mirroredDistance / DISTANCE_FALLOFF), MIN_SCALE);
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
    itemTop += BASE_HEIGHT * scale;
  }

  return scales;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const ScaleList = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const animationFrame = useRef(null);
  const updateFrame = useRef(null);
  const renderedPointerY = useRef(-1000);
  const renderedScales = useRef([]);
  const targetScales = useRef([]);
  const targetPointerY = useRef(-1000);
  const trackpadPointerY = useRef(null);
  const touchPointerY = useRef(null);
  const touchStartY = useRef(null);
  const [scales, setScales] = useState([]);
  const maxVisualScale = isMobile ? MAX_VISUAL_SCALE * MOBILE_SCALE_MULTIPLIER : MAX_VISUAL_SCALE;
  const distanceMultiplier = isMobile ? MOBILE_DISTANCE_MULTIPLIER : 1;
  const trackpadSensitivity = isMobile ? MOBILE_TRACKPAD_SENSITIVITY : TRACKPAD_SENSITIVITY;
  const repeatCount = isMobile ? MOBILE_REPEAT_COUNT : DESKTOP_REPEAT_COUNT;

  const mappedArray = useMemo(() => Array.from({ length: repeatCount }, () => array).flat(), [array, repeatCount]);

  const animateScales = useCallback(() => {
    if (!containerRef.current) {
      animationFrame.current = null;
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const pointerDifference = targetPointerY.current - renderedPointerY.current;
    let nextPointerY = targetPointerY.current;

    if (Math.abs(pointerDifference) > POINTER_SETTLE_THRESHOLD) {
      nextPointerY = renderedPointerY.current + pointerDifference * POINTER_SMOOTHING;
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
      return currentScale + difference * SCALE_SMOOTHING;
    });

    renderedScales.current = nextScales;
    setScales(nextScales);

    animationFrame.current =
      areScalesSettled && Math.abs(pointerDifference) <= POINTER_SETTLE_THRESHOLD
        ? null
        : requestAnimationFrame(animateScales);
  }, [distanceMultiplier, mappedArray.length, maxVisualScale]);

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
      return;
    }

    startScaleAnimation();
  }, [distanceMultiplier, mappedArray.length, maxVisualScale, startScaleAnimation]);

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
      targetPointerY.current = nextPointerY;
      scheduleScaleUpdate();
    },
    [scheduleScaleUpdate, trackpadSensitivity],
  );

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;

      trackpadPointerY.current = null;
      touchPointerY.current = null;
      targetPointerY.current = event.clientY;
      scheduleScaleUpdate();
    };

    updateScales();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", scheduleScaleUpdate);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (updateFrame.current) cancelAnimationFrame(updateFrame.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", scheduleScaleUpdate);
    };
  }, [scheduleScaleUpdate, updateScales]);

  const handlePointerLeave = (event) => {
    if (event.pointerType === "touch") return;

    trackpadPointerY.current = null;
    touchPointerY.current = null;
    targetPointerY.current = -1000;
    scheduleScaleUpdate();
  };

  const handleWheel = (event) => {
    event.preventDefault();
    updateVirtualPointer(event.deltaY);
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
      onPointerLeave={handlePointerLeave}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      {mappedArray.map((entry, index) => (
        <ScaleListItem
          baseHeight={BASE_HEIGHT}
          entry={entry}
          key={`${entry._id}-${index}`}
          maxVisualScale={maxVisualScale}
          scale={scales[index] ?? MIN_SCALE}
        />
      ))}
    </motion.ul>
  );
};

export default ScaleList;
