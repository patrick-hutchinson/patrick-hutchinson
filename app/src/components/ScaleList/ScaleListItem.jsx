import styles from "./ScaleList.module.css";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { motion } from "motion/react";
import Media from "@/components/Media/Media";

const MOBILE_MARQUEE_SPEED = 0.0095;

const ScaleListItem = ({
  baseHeight,
  entry,
  isMobile,
  isSelected,
  maxVisualScale,
  mountVideo,
  playVideo,
  scale,
  thumbnailMedium,
  thumbnailUrl,
}) => {
  const mobileTextRef = useRef(null);
  const mobileMarqueeRef = useRef(null);
  const mobileMarqueeSegmentRef = useRef(null);
  const [mobileMarqueeDistance, setMobileMarqueeDistance] = useState(0);
  const height = `${baseHeight * scale}px`;
  const visualScale = Math.min(scale, maxVisualScale);
  const shouldMountThumbnailVideo = !isMobile && mountVideo && thumbnailMedium?.type === "video";
  const releaseDate = entry.scheduling?.year
    ? `${entry.scheduling?.month} ‘${entry.scheduling.year.slice(2)}`
    : entry.scheduling?.month;

  const Wrapper = entry._type === "project" ? Link : "div";
  const wrapperProps =
    entry._type === "project" ? { draggable: false, href: `/projects/${entry.slug.current}`, scroll: false } : {};

  useEffect(() => {
    if (!isMobile || !isSelected) {
      setMobileMarqueeDistance(0);
      return undefined;
    }

    const updateMarqueeDistance = () => {
      const containerWidth = mobileTextRef.current?.clientWidth || 0;
      const contentWidth = mobileMarqueeSegmentRef.current?.scrollWidth || 0;
      const loopGap = parseFloat(getComputedStyle(mobileMarqueeRef.current).columnGap) || 0;

      setMobileMarqueeDistance(contentWidth > containerWidth ? contentWidth + loopGap : 0);
    };

    updateMarqueeDistance();
    window.addEventListener("resize", updateMarqueeDistance);
    document.fonts?.ready.then(updateMarqueeDistance);

    return () => {
      window.removeEventListener("resize", updateMarqueeDistance);
    };
  }, [entry.title, entry.scheduling?.location, isMobile, isSelected, releaseDate, thumbnailUrl, visualScale]);

  const thumbnail = thumbnailUrl ? (
    <span className={styles.thumbnail} aria-hidden="true">
      <img alt="" className={styles.thumbnailImage} draggable={false} loading="eager" src={thumbnailUrl} />
      {shouldMountThumbnailVideo ? (
        <Media
          className={[
            styles.thumbnailMedia,
            playVideo ? styles.thumbnailMediaActive : styles.thumbnailMediaInactive,
          ].join(" ")}
          medium={thumbnailMedium}
          eager
          paused={!playVideo}
          showPlaceholder={false}
        />
      ) : null}
    </span>
  ) : null;
  const mobileMarqueeContent = (
    <>
      {thumbnail}
      <span className={styles.releaseDate}>{releaseDate}</span>
      <span className={styles.mobileTitle}>{entry.title}</span>
      <span className={styles.location}>{entry.scheduling?.location}</span>
    </>
  );

  return (
    <motion.li className={styles.scaleListItem} style={{ height }}>
      <motion.div className={styles.scaleListItemContent} style={{ scale: visualScale }}>
        <Wrapper className={styles.scaleListItemLink} {...wrapperProps}>
          <div className={styles.scaleListItem_inner}>
            {isMobile ? (
              <span
                className={[
                  styles.scaleListItemText,
                  styles.mobileText,
                  isSelected ? styles.mobileTextSelected : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                ref={mobileTextRef}
                style={{
                  "--mobile-marquee-distance": `${mobileMarqueeDistance}px`,
                  "--mobile-marquee-duration": `${Math.max(3, mobileMarqueeDistance * MOBILE_MARQUEE_SPEED)}s`,
                  "--mobile-visual-scale": visualScale,
                }}
              >
                <span className={styles.mobileTextMarquee} ref={mobileMarqueeRef}>
                  <span className={styles.mobileTextMarqueeSegment} ref={mobileMarqueeSegmentRef}>
                    {mobileMarqueeContent}
                  </span>
                  {isSelected && mobileMarqueeDistance > 0 ? (
                    <span aria-hidden="true" className={styles.mobileTextMarqueeSegment}>
                      {mobileMarqueeContent}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : (
              <>
                {thumbnail}
                <span className={styles.scaleListItemText}>
                  <span className={styles.releaseDate}>{releaseDate}</span>
                  <span className={styles.scaleListTitle}>{entry.title}</span>
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
