import styles from "./ListView.module.css";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { motion } from "motion/react";
import Media from "@/components/Media/Media";

const MOBILE_MARQUEE_SPEED = 0.0095;

const ListViewItem = ({
  baseHeight,
  entry,
  gap = 0,
  isMobile,
  isSelected,
  maxVisualScale,
  playVideo,
  scale,
  thumbnailMedium,
  thumbnailUrl,
}) => {
  const mobileTextRef = useRef(null);
  const mobileMarqueeRef = useRef(null);
  const mobileMarqueeSegmentRef = useRef(null);
  const [mobileMarqueeDistance, setMobileMarqueeDistance] = useState(0);
  const height = `${baseHeight * scale + gap}px`;
  const visualScale = Math.min(scale, maxVisualScale);
  const shouldPlayThumbnailVideo = playVideo && thumbnailMedium?.type === "video";
  const releaseYear = entry.scheduling?.year ? `‘${entry.scheduling.year.slice(2)}` : "";

  const useLink = entry._type === "project";
  const Wrapper = useLink ? Link : "div";
  const wrapperProps = useLink
    ? {
        draggable: false,
        href: `/projects/${entry.slug.current}`,
        onDragStart: (event) => event.preventDefault(),
        scroll: false,
      }
    : {};

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
  }, [entry.title, entry.scheduling?.location, isMobile, isSelected, releaseYear, thumbnailUrl, visualScale]);

  const mobileMarqueeContent = (
    <>
      {thumbnailUrl ? (
        <span className={styles.thumbnail} aria-hidden="true">
          <img alt="" className={styles.thumbnailImage} draggable={false} loading="eager" src={thumbnailUrl} />
          {shouldPlayThumbnailVideo ? (
            <Media className={styles.thumbnailMedia} medium={thumbnailMedium} eager showPlaceholder={false} />
          ) : null}
        </span>
      ) : null}
      <span className={styles.mobileTitle}>{entry.title}</span>
      <span className={styles.releaseDate}>{releaseYear}</span>
      <span className={styles.location}>{entry.scheduling?.location}</span>
    </>
  );

  return (
    <motion.li className={styles.listViewItem} style={{ height }}>
      <motion.div className={styles.listViewItemContent} style={{ scale: visualScale }}>
        <Wrapper className={styles.listViewItemLink} {...wrapperProps}>
          <div className={styles.listViewItemInner}>
            {isMobile ? (
              <span
                className={[styles.listViewItemText, styles.mobileText, isSelected ? styles.mobileTextSelected : null]
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
                {thumbnailUrl ? (
                  <span className={styles.thumbnail} aria-hidden="true">
                    <img alt="" className={styles.thumbnailImage} draggable={false} loading="eager" src={thumbnailUrl} />
                    {shouldPlayThumbnailVideo ? (
                      <Media className={styles.thumbnailMedia} medium={thumbnailMedium} eager showPlaceholder={false} />
                    ) : null}
                  </span>
                ) : null}{" "}
                <span className={styles.releaseDate}>{releaseYear}</span>
                <span className={styles.listViewItemText}>
                  <span className={styles.listViewTitle}>{entry.title}</span>
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

export default ListViewItem;
