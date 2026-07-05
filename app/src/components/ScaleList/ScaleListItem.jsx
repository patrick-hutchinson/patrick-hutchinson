import styles from "./ScaleList.module.css";

import Link from "next/link";

import { motion } from "motion/react";

const ScaleListItem = ({ baseHeight, entry, maxVisualScale, scale }) => {
  const height = `${baseHeight * scale}px`;
  const visualScale = Math.min(scale, maxVisualScale);

  const Wrapper = entry._type === "project" ? Link : "div";
  const wrapperProps = entry._type === "project" ? { href: entry.slug.current } : {};

  return (
    <motion.li className={styles.scaleListItem} style={{ height }}>
      <motion.div className={styles.scaleListItemContent} style={{ scale: visualScale }}>
        <Wrapper {...wrapperProps}>{entry.title}</Wrapper>
      </motion.div>
    </motion.li>
  );
};

export default ScaleListItem;
