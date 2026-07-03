import { useEffect, useRef } from "react";
import ScaleListItem from "./ScaleListItem";

import { motion, useMotionValue, useSpring } from "motion/react";

import styles from "./ScaleList.module.css";

const ScaleList = ({ array }) => {
  const containerRef = useRef(null);
  const pointerY = useMotionValue(-1000);
  const cursorY = useSpring(pointerY, { stiffness: 500, damping: 45 });

  useEffect(() => {
    const handlePointerMove = (event) => {
      pointerY.set(event.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [pointerY]);

  const handlePointerLeave = () => {
    pointerY.set(-1000);
  };

  const mappedArray = [...array, ...array, ...array, ...array, ...array];

  return (
    <motion.ul className={styles.scaleList} ref={containerRef} onPointerLeave={handlePointerLeave}>
      {mappedArray.map((entry, index) => (
        <ScaleListItem entry={entry} cursorY={cursorY} key={`${entry._id}-${index}`} />
      ))}
    </motion.ul>
  );
};

export default ScaleList;
