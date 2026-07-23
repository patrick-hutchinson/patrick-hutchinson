import styles from "./ScaleList.module.css";

import Link from "next/link";

import { motion } from "motion/react";
import Media from "@/components/Media/Media";

const ScaleListItem = ({
  baseHeight,
  entry,
  gap = 0,
  isMobile,
  maxVisualScale,
  playVideo,
  scale,
  thumbnailMedium,
  thumbnailUrl,
}) => {
  const height = `${baseHeight * scale + gap}px`;
  const visualScale = Math.min(scale, maxVisualScale);
  const shouldPlayThumbnailVideo = playVideo && thumbnailMedium?.type === "video";
  const releaseYear = entry.scheduling?.year ? `‘${entry.scheduling.year.slice(0, 2)}` : "";

  const Wrapper = entry._type === "project" ? Link : "div";
  const wrapperProps = entry._type === "project" ? { href: `/projects/${entry.slug.current}`, scroll: false } : {};

  return (
    <motion.li className={styles.scaleListItem} style={{ height }}>
      <motion.div className={styles.scaleListItemContent} style={{ scale: visualScale }}>
        <Wrapper className={styles.scaleListItemLink} {...wrapperProps}>
          <div className={styles.scaleListItem_inner}>
            {isMobile ? (
              <span className={styles.scaleListItemText}>
                {entry.title}
                <span className={styles.releaseDate}>{releaseYear}</span>
                <span className={styles.location}>{entry.scheduling?.location}</span>
              </span>
            ) : (
              <>
                {thumbnailUrl ? (
                  <span className={styles.thumbnail} aria-hidden="true">
                    <img alt="" className={styles.thumbnailImage} draggable={false} loading="eager" src={thumbnailUrl} />
                    {shouldPlayThumbnailVideo ? (
                      <Media className={styles.thumbnailMedia} medium={thumbnailMedium} eager showPlaceholder={false} />
                    ) : null}
                  </span>
                ) : null}{" "}
                <span className={styles.releaseDate}>{releaseYear}</span>
                <span className={styles.scaleListItemText}>
                  {entry.title}
                  <span className={styles.location}>{entry.scheduling?.location}</span>
                </span>
              </>
            )}
          </div>
        </Wrapper>
      </motion.div>
    </motion.li>
  );
};

export default ScaleListItem;
