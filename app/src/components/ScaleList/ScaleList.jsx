import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion } from "motion/react";

import styles from "./ScaleList.module.css";

const BASE_HEIGHT = 64;
const MAX_VISUAL_SCALE = 2.2;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 100;
const SOLVE_PASSES = 8;
const POINTER_SMOOTHING = 1;
const POINTER_SETTLE_THRESHOLD = 0.25;
const SCALE_SMOOTHING = 0.2;
const SCALE_SETTLE_THRESHOLD = 0.002;
const TRACKPAD_SENSITIVITY = 1;

function getScaleFromDistance(distance) {
  const minScaleDistance = -Math.log(MIN_SCALE / MAX_VISUAL_SCALE) * DISTANCE_FALLOFF;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(MAX_VISUAL_SCALE * Math.exp(-mirroredDistance / DISTANCE_FALLOFF), MIN_SCALE);
}

function getScaleForItem(cursorY, itemTop) {
  let scale = 1;

  for (let i = 0; i < SOLVE_PASSES; i += 1) {
    const itemCenter = itemTop + (BASE_HEIGHT * scale) / 2;
    scale = getScaleFromDistance(Math.abs(cursorY - itemCenter));
  }

  return scale;
}

function getScales(cursorY, listTop, itemCount) {
  const scales = [];
  let itemTop = listTop;

  for (let index = 0; index < itemCount; index += 1) {
    const scale = getScaleForItem(cursorY, itemTop);

    scales.push(scale);
    itemTop += BASE_HEIGHT * scale;
  }

  return scales;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const ScaleList = ({ array }) => {
  const containerRef = useRef(null);
  const animationFrame = useRef(null);
  const updateFrame = useRef(null);
  const renderedPointerY = useRef(-1000);
  const renderedScales = useRef([]);
  const targetScales = useRef([]);
  const targetPointerY = useRef(-1000);
  const trackpadPointerY = useRef(null);
  const [scales, setScales] = useState([]);

  const mappedArray = useMemo(
    () => [...array, ...array, ...array, ...array, ...array, ...array, ...array, ...array, ...array, ...array],
    [array],
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
      nextPointerY = renderedPointerY.current + pointerDifference * POINTER_SMOOTHING;
    }

    renderedPointerY.current = nextPointerY;
    targetScales.current = getScales(nextPointerY, rect.top, mappedArray.length);

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
  }, [mappedArray.length]);

  const startScaleAnimation = useCallback(() => {
    if (animationFrame.current) return;

    animationFrame.current = requestAnimationFrame(animateScales);
  }, [animateScales]);

  const updateScales = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const nextTargetScales = getScales(targetPointerY.current, rect.top, mappedArray.length);

    targetScales.current = nextTargetScales;

    if (renderedScales.current.length !== nextTargetScales.length) {
      renderedPointerY.current = targetPointerY.current;
      renderedScales.current = nextTargetScales;
      setScales(nextTargetScales);
      return;
    }

    startScaleAnimation();
  }, [mappedArray.length, startScaleAnimation]);

  const scheduleScaleUpdate = useCallback(() => {
    if (updateFrame.current) cancelAnimationFrame(updateFrame.current);

    updateFrame.current = requestAnimationFrame(() => {
      updateFrame.current = null;
      updateScales();
    });
  }, [updateScales]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      trackpadPointerY.current = null;
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

  const handlePointerLeave = () => {
    trackpadPointerY.current = null;
    targetPointerY.current = -1000;
    scheduleScaleUpdate();
  };

  const handleWheel = (event) => {
    if (!containerRef.current) return;

    event.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const currentPointerY =
      trackpadPointerY.current ??
      (targetPointerY.current >= rect.top && targetPointerY.current <= rect.bottom
        ? targetPointerY.current
        : rect.top + rect.height / 2);
    const nextPointerY = clamp(currentPointerY + event.deltaY * TRACKPAD_SENSITIVITY, rect.top, rect.bottom);

    trackpadPointerY.current = nextPointerY;
    targetPointerY.current = nextPointerY;
    scheduleScaleUpdate();
  };

  if (!array.length) return null;

  return (
    <motion.ul className={styles.scaleList} ref={containerRef} onPointerLeave={handlePointerLeave} onWheel={handleWheel}>
      {mappedArray.map((entry, index) => (
        <ScaleListItem
          baseHeight={BASE_HEIGHT}
          entry={entry}
          key={`${entry._id}-${index}`}
          maxVisualScale={MAX_VISUAL_SCALE}
          scale={scales[index] ?? MIN_SCALE}
        />
      ))}
    </motion.ul>
  );
};

export default ScaleList;
