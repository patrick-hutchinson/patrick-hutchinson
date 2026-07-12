import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import CyclingMedia from "@/components/Media/CyclingMedia";

import styles from "./ProjectCursor.module.css";

const DEFAULT_TITLE_WIDTH = "0px";

function getPreviewMedia(project) {
  const gallery = Array.isArray(project?.gallery) ? project.gallery.filter((item) => item?.medium) : [];

  return {
    gallery,
    medium: project?.coverMedia?.medium || project?.thumbnail?.medium || project?.medium,
  };
}

function isPointNearRect(x, y, rect, distance) {
  const nearestX = Math.max(rect.left, Math.min(x, rect.right));
  const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));

  return Math.hypot(x - nearestX, y - nearestY) <= distance;
}

const ProjectCursor = ({ isActive = false, project, showWhenInactive = true }) => {
  const ref = useRef(null);
  const titleRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isNearMenu, setIsNearMenu] = useState(false);
  const [titleWidth, setTitleWidth] = useState(DEFAULT_TITLE_WIDTH);

  const previewMedia = getPreviewMedia(project);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const x = useSpring(mouseX, {
    stiffness: 300,
    damping: 35,
  });

  const y = useSpring(mouseY, {
    stiffness: 400,
    damping: 35,
  });

  useEffect(() => {
    mouseX.set(window.innerWidth / 2);
    mouseY.set(window.innerHeight / 2);
    setIsReady(true);

    const handleMouseMove = (e) => {
      if (!ref.current) return;

      const menu = document.querySelector("[data-menu-control]");
      const nextIsNearMenu = menu ? isPointNearRect(e.clientX, e.clientY, menu.getBoundingClientRect(), 100) : false;

      setIsNearMenu((currentIsNearMenu) => (currentIsNearMenu === nextIsNearMenu ? currentIsNearMenu : nextIsNearMenu));

      const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin"));

      const { width, height } = ref.current.getBoundingClientRect();

      const halfW = width / 2;
      const halfH = height / 2;

      const clampedX = Math.min(window.innerWidth - margin - halfW, Math.max(margin + halfW, e.clientX));

      const clampedY = Math.min(window.innerHeight - margin - halfH, Math.max(margin + halfH, e.clientY));

      mouseX.set(clampedX);
      mouseY.set(clampedY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, project?._id]);

  useEffect(() => {
    const titleNode = titleRef.current;
    if (!titleNode) return undefined;

    const measureTitle = () => {
      const range = document.createRange();
      range.selectNodeContents(titleNode);

      const lineWidths = Array.from(range.getClientRects()).map((rect) => rect.width);
      range.detach();

      const measuredWidth = lineWidths.length ? Math.max(...lineWidths) : titleNode.getBoundingClientRect().width;
      setTitleWidth(`${measuredWidth}px`);
    };

    measureTitle();

    const resizeObserver = new ResizeObserver(measureTitle);
    resizeObserver.observe(titleNode);
    document.fonts?.ready.then(measureTitle);
    window.addEventListener("resize", measureTitle);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureTitle);
    };
  }, [project?.title]);

  useEffect(() => {
    if (isNearMenu) {
      document.documentElement.dataset.projectCursorNearMenu = "true";
    } else {
      delete document.documentElement.dataset.projectCursorNearMenu;
    }

    return () => {
      delete document.documentElement.dataset.projectCursorNearMenu;
    };
  }, [isNearMenu]);

  if (!project || (!showWhenInactive && !isActive)) return null;

  const cursorOpacity = !isReady || isNearMenu ? 0 : isActive ? 1 : "var(--opacity)";

  return (
    <motion.div
      ref={ref}
      typo="h2"
      style={{
        "--project-cursor-title-width": titleWidth,
        position: "fixed",
        left: 0,
        top: 0,
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        pointerEvents: "none",
        zIndex: 1000,
      }}
      className={styles.cursor}
      animate={{ opacity: cursorOpacity, scale: isNearMenu ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <span className={styles.title} ref={titleRef}>
        {project.title}
      </span>
      <AnimatePresence>
        {isActive && (previewMedia.gallery.length || previewMedia.medium) ? (
          <motion.span
            className={styles.preview}
            key={project._id || project.title}
            initial={{ opacity: 0, scale: 0, y: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0, y: "-50%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CyclingMedia className={styles.previewMedia} gallery={previewMedia.gallery} medium={previewMedia.medium} />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectCursor;
