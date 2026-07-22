import Link from "next/link";
import { AnimatePresence, useInView } from "framer-motion";
import { useContext, useMemo, useRef, useState } from "react";

import styles from "./NextProject.module.css";
import Footer from "../Footer/Footer";
import ImageTrail from "../ImageTrail/ImageTrail";
import ProjectCursor from "../ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";
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

const NextProject = ({ lastUpdatedAt, onHoverEnd, onHoverStart, project }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const isInView = useInView(containerRef, { amount: 0.75 });
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
      <AnimatePresence>
        {isMobile && isInView ? (
          <ProjectCursor
            key={project._id || project.slug.current}
            isActive
            project={project}
            showPreview={false}
            staticCentered
          />
        ) : null}
      </AnimatePresence>
      {!isMobile ? (
        <ProjectCursor
          boundsRef={containerRef}
          inactiveOpacity={0}
          isActive={isHovered}
          project={project}
          showPreview={false}
        />
      ) : null}
      <Link
        aria-label={`Next project: ${project.title}`}
        className={styles.nextProjectContainer}
        href={`/projects/${project.slug.current}`}
        onBlur={handleLeave}
        onFocus={handleEnter}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        ref={containerRef}
        scroll={false}
      >
        {!isMobile ? <ImageTrail isActive={isHovered} media={trailMedia} /> : null}
        <div typo="h2" className={styles.nextProjectHeader}>
          Next Project:
        </div>

        <Footer className={styles.footer} lastUpdatedAt={lastUpdatedAt} />
      </Link>
    </>
  );
};

export default NextProject;
