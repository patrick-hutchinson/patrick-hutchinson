import styles from "./ScaleList.module.css";

import { motion } from "motion/react";

const ScaleListItem = ({ baseHeight, entry, maxVisualScale, scale }) => {
  const height = `${baseHeight * scale}px`;
  const visualScale = Math.min(scale, maxVisualScale);

  return (
    <motion.li className={styles.scaleListItem} style={{ height }}>
      <motion.div className={styles.scaleListItemContent} style={{ scale: visualScale }}>
        {entry.title}
      </motion.div>
    </motion.li>
  );
};

export default ScaleListItem;
