import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import styles from "./NextProject.module.css";
import Footer from "../Footer/Footer";
import ImageTrail from "../ImageTrail/ImageTrail";
import ProjectCursor from "../ProjectCursor/ProjectCursor";
import Media from "../Media/Media";
import { DeviceContext } from "@/context/DeviceContext";
import { getLocalizedPath } from "@/lib/i18n";
import { getProjectThumbnailMedia } from "@/lib/media/projectThumbnails";

function getPageBuilderMedia(pageBuilder) {
  if (!Array.isArray(pageBuilder)) return [];

  return pageBuilder.flatMap((block) => {
    if (block?._type === "projectFullscreenMedium") return block?.medium?.medium ? [block.medium.medium] : [];
    if (block?._type === "projectScaleGallery") {
      return Array.isArray(block.media) ? block.media.map((entry) => entry?.medium).filter(Boolean) : [];
    }

    return [];
  });
}

function MobileMediaPopups({ media }) {
  const ref = useRef(null);
  const hasEntered = useInView(ref, { amount: 0.15, once: true });
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    setPositions(
      media.map(() => ({
        left: 5 + Math.random() * 50,
        top: 12 + Math.random() * 62,
        rotate: Math.random() * 16 - 8,
      })),
    );
  }, [media]);

  return (
    <div aria-hidden="true" className={styles.mobileMediaPopups} ref={ref}>
      {positions.map((position, index) => (
        <motion.div
          className={styles.mobileMediaPopup}
          key={index}
          initial={{ opacity: 0, scale: 0.65, y: 24, rotate: position.rotate }}
          animate={hasEntered ? { opacity: 1, scale: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, delay: index * 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ left: `${position.left}%`, top: `${position.top}%` }}
        >
          <Media medium={media[index]} paused={!hasEntered} />
        </motion.div>
      ))}
    </div>
  );
}

const NextProject = ({ language = "en", lastUpdatedAt, onHoverEnd, onHoverStart, project }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const trailMedia = useMemo(() => {
    const thumbnailMedium = getProjectThumbnailMedia(project, isMobile);

    return [thumbnailMedium, ...getPageBuilderMedia(project?.pageBuilder)].filter(Boolean);
  }, [isMobile, project]);

  if (!project?.slug?.current) return null;

  const handleEnter = () => {
    setIsHovered(true);
    onHoverStart?.();
  };

  const handleLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  return (
    <>
      {!isMobile ? (
        <ProjectCursor
          activeOpacity="var(--opacity)"
          boundsRef={containerRef}
          className={styles.nextProjectCursor}
          inactiveOpacity={0}
          isActive={isHovered}
          project={project}
          showPreview={false}
        />
      ) : null}
      <Link
        aria-label={`Next project: ${project.title}`}
        className={styles.nextProjectContainer}
        href={getLocalizedPath(`/projects/${project.slug.current}`, language)}
        onBlur={handleLeave}
        onFocus={handleEnter}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={containerRef}
        scroll={false}
      >
        {!isMobile ? (
          <ImageTrail isActive={isHovered} media={trailMedia} />
        ) : (
          <MobileMediaPopups key={project._id || project.slug.current} media={trailMedia} />
        )}
        <div typo="h2-static" className={styles.nextProjectHeader}>
          Next Project:
        </div>

        {isMobile ? (
          <div className={styles.mobileProjectTitle} typo="h2-static">
            {project.title}
          </div>
        ) : (
          <Footer className={styles.footer} lastUpdatedAt={lastUpdatedAt} />
        )}
      </Link>
    </>
  );
};

export default NextProject;
