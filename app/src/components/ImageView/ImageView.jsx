import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import Media from "@/components/Media/Media";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";
import { getProjectThumbnailMedia, preloadMedium } from "@/lib/media/projectThumbnails";

import styles from "./ImageView.module.css";

const SCROLL_SENSITIVITY = 1;
const CHANGE_SCALE_DURATION = 320;

function wrap(value, max) {
  if (max <= 0) return 0;
  return ((value % max) + max) % max;
}

const ImageView = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const router = useRouter();
  const projects = useMemo(
    () =>
      array.filter(
        (entry) =>
          entry?._type === "project" &&
          entry?.slug?.current &&
          (entry?.thumbnail?.medium ||
            entry?.thumbnail_mobile?.medium ||
            entry?.coverMedia?.medium ||
            entry?.coverMedia_mobile?.medium),
      ),
    [array],
  );
  const thumbnailMedia = useMemo(
    () => projects.map((project) => getProjectThumbnailMedia(project, isMobile)),
    [isMobile, projects],
  );
  const virtualY = useRef(0);
  const preloadedMedia = useRef([]);
  const hasInitializedActiveIndex = useRef(false);
  const scaleTimeout = useRef(null);
  const touchY = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scalingIndex, setScalingIndex] = useState(null);

  const updateFromVirtualY = useCallback(
    (nextY) => {
      if (!projects.length) return;

      const segmentHeight = window.innerHeight / projects.length;
      const wrappedY = wrap(nextY, window.innerHeight);
      const nextIndex = Math.min(Math.floor(wrappedY / segmentHeight), projects.length - 1);

      virtualY.current = wrappedY;
      setActiveIndex(nextIndex);
    },
    [projects.length],
  );

  useEffect(() => {
    updateFromVirtualY(window.innerHeight / 2);

    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;
      updateFromVirtualY(event.clientY);
    };

    const handleResize = () => updateFromVirtualY(virtualY.current);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateFromVirtualY]);

  useEffect(() => {
    preloadedMedia.current = projects
      .flatMap((project) => [project?.thumbnail?.medium, project?.thumbnail_mobile?.medium])
      .map((medium) => preloadMedium(medium))
      .filter(Boolean);
  }, [projects]);

  useEffect(() => {
    if (!hasInitializedActiveIndex.current) {
      hasInitializedActiveIndex.current = true;
      return undefined;
    }

    if (scaleTimeout.current) window.clearTimeout(scaleTimeout.current);

    setScalingIndex(activeIndex);

    scaleTimeout.current = window.setTimeout(() => {
      setScalingIndex(null);
      scaleTimeout.current = null;
    }, CHANGE_SCALE_DURATION);

    return () => {
      if (scaleTimeout.current) window.clearTimeout(scaleTimeout.current);
    };
  }, [activeIndex]);

  const handleWheel = (event) => {
    event.preventDefault();
    updateFromVirtualY(virtualY.current + event.deltaY * SCROLL_SENSITIVITY);
  };

  const handleTouchStart = (event) => {
    touchY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (touchY.current === null) return;

    event.preventDefault();

    const nextTouchY = event.touches[0]?.clientY;
    if (typeof nextTouchY !== "number") return;

    updateFromVirtualY(virtualY.current + touchY.current - nextTouchY);
    touchY.current = nextTouchY;
  };

  const handleTouchEnd = () => {
    touchY.current = null;
  };

  const activeProject = projects[activeIndex];
  const usesMobileThumbnail = isMobile && Boolean(activeProject?.thumbnail_mobile?.medium);

  const navigateToActiveProject = () => {
    if (!activeProject?.slug?.current) return;

    router.push(`/projects/${activeProject.slug.current}`, undefined, { scroll: false });
  };

  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    navigateToActiveProject();
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    navigateToActiveProject();
  };

  if (!projects.length) return null;

  return (
    <div
      className={styles.imageView}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
      role="link"
      tabIndex={0}
    >
      <ProjectCursor className={styles.cursor} isActive project={activeProject} showPreview={false} />
      <motion.div
        animate={{ scale: 1 }}
        className={[styles.mediaFrame, usesMobileThumbnail ? styles.mobileMediaFrame : null].filter(Boolean).join(" ")}
        initial={{ scale: 0.96 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {projects.map((project, index) => {
          const medium = thumbnailMedia[index];
          const isActive = index === activeIndex;
          const usesMobileProjectThumbnail = isMobile && Boolean(project?.thumbnail_mobile?.medium);

          return (
            <div
              className={[
                styles.mediaItem,
                isActive ? styles.mediaItemActive : null,
                scalingIndex === index ? styles.mediaItemScalePulse : null,
                usesMobileProjectThumbnail ? styles.mobileMediaItem : null,
              ]
                .filter(Boolean)
                .join(" ")}
              key={project._id}
            >
              <Media className={styles.media} medium={medium} eager paused={!isActive} />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default ImageView;
