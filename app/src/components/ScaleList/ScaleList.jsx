import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion } from "motion/react";

import styles from "./ScaleList.module.css";

const BASE_HEIGHT = 64;
const MAX_VISUAL_SCALE = 2;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 100;
const SOLVE_PASSES = 8;

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

const ScaleList = ({ array }) => {
  const containerRef = useRef(null);
  const updateFrame = useRef(null);
  const pointerY = useRef(-1000);
  const [scales, setScales] = useState([]);

  const mappedArray = useMemo(() => [...array, ...array, ...array, ...array, ...array], [array]);

  const updateScales = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setScales(getScales(pointerY.current, rect.top, mappedArray.length));
  }, [mappedArray.length]);

  const scheduleScaleUpdate = useCallback(() => {
    if (updateFrame.current) cancelAnimationFrame(updateFrame.current);

    updateFrame.current = requestAnimationFrame(() => {
      updateFrame.current = null;
      updateScales();
    });
  }, [updateScales]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      pointerY.current = event.clientY;
      scheduleScaleUpdate();
    };

    updateScales();
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", scheduleScaleUpdate);

    return () => {
      if (updateFrame.current) cancelAnimationFrame(updateFrame.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", scheduleScaleUpdate);
    };
  }, [scheduleScaleUpdate, updateScales]);

  const handlePointerLeave = () => {
    pointerY.current = -1000;
    scheduleScaleUpdate();
  };

  return (
    <motion.ul className={styles.scaleList} ref={containerRef} onPointerLeave={handlePointerLeave}>
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
