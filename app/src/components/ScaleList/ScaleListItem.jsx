import styles from "./ScaleList.module.css";

import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "motion/react";
import { useCallback, useLayoutEffect, useRef } from "react";

const BASE_HEIGHT = 64;
const MAX_VISUAL_SCALE = 1.6;
const MIN_SCALE = 0.05;
const DISTANCE_FALLOFF = 100;

function getScaleFromDistance(distance) {
  const minScaleDistance = -Math.log(MIN_SCALE / MAX_VISUAL_SCALE) * DISTANCE_FALLOFF;
  const mirroredDistance = minScaleDistance - Math.abs((distance % (minScaleDistance * 2)) - minScaleDistance);

  return Math.max(MAX_VISUAL_SCALE * Math.exp(-mirroredDistance / DISTANCE_FALLOFF), MIN_SCALE);
}

const ScaleListItem = ({ entry, cursorY }) => {
  const itemRef = useRef(null);

  const centerY = useMotionValue(0);
  const rawScale = useTransform([cursorY, centerY], ([cursor, center]) => {
    const distance = Math.abs(cursor - center);

    return getScaleFromDistance(distance);
  });
  const scale = useSpring(rawScale, { stiffness: 320, damping: 32 });
  const height = useTransform(scale, (latest) => `${BASE_HEIGHT * latest}px`);
  const visualScale = useTransform(scale, (latest) => Math.min(latest, MAX_VISUAL_SCALE));

  const updateCenter = useCallback(() => {
    if (!itemRef.current) return;

    const rect = itemRef.current.getBoundingClientRect();
    centerY.set(rect.top + rect.height / 2);
  }, [centerY]);

  useLayoutEffect(() => {
    updateCenter();
    window.addEventListener("resize", updateCenter);

    return () => window.removeEventListener("resize", updateCenter);
  }, [updateCenter]);

  useMotionValueEvent(cursorY, "change", updateCenter);
  useMotionValueEvent(scale, "change", updateCenter);

  return (
    <motion.li className={styles.scaleListItem} ref={itemRef} style={{ height }}>
      <motion.div className={styles.scaleListItemContent} style={{ scale: visualScale }}>
        {entry.title}
      </motion.div>
    </motion.li>
  );
};

export default ScaleListItem;
