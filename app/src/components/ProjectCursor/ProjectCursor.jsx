import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import CyclingMedia from "@/components/Media/CyclingMedia";

import styles from "./ProjectCursor.module.css";

const DEFAULT_TITLE_WIDTH = "0px";
const fallbackPointer = { x: 0, y: 0 };

let lastPointer = null;
let isTrackingPointer = false;

function ensurePointerTracker() {
  if (typeof window === "undefined" || isTrackingPointer) return;

  fallbackPointer.x = window.innerWidth / 2;
  fallbackPointer.y = window.innerHeight / 2;

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;

      lastPointer = {
        x: event.clientX,
        y: event.clientY,
      };
    },
    { passive: true },
  );

  isTrackingPointer = true;
}

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

function isPointInsideRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function clampToRange(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

const ProjectCursor = ({
  isActive = false,
  boundsRef,
  className,
  inactiveOpacity = "var(--opacity)",
  project,
  showPreview = true,
  showWhenInactive = true,
  staticCentered = false,
}) => {
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

  const positionCursor = (clientX, clientY, shouldJump = false) => {
    const margin = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--margin"));
    const { width, height } = ref.current?.getBoundingClientRect() || { width: 0, height: 0 };
    const bounds = boundsRef?.current?.getBoundingClientRect();
    const halfW = width / 2;
    const halfH = height / 2;
    const minX = bounds ? bounds.left + halfW : margin + halfW;
    const maxX = bounds ? bounds.right - halfW : window.innerWidth - margin - halfW;
    const minY = bounds ? bounds.top + halfH : margin + halfH;
    const maxY = bounds ? bounds.bottom - halfH : window.innerHeight - margin - halfH;
    const clampedX = clampToRange(clientX, minX, maxX);
    const clampedY = clampToRange(clientY, minY, maxY);

    mouseX.set(clampedX);
    mouseY.set(clampedY);

    if (shouldJump) {
      x.jump?.(clampedX);
      y.jump?.(clampedY);
    }
  };

  useEffect(() => {
    if (staticCentered) {
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
      setIsReady(true);
      return undefined;
    }

    ensurePointerTracker();
    const initialPointer = lastPointer || fallbackPointer;
    positionCursor(initialPointer.x, initialPointer.y, true);
    setIsReady(true);

    const handleMouseMove = (e) => {
      if (!ref.current) return;

      const menu = document.querySelector("[data-menu-control]");
      const nextIsNearMenu = menu ? isPointNearRect(e.clientX, e.clientY, menu.getBoundingClientRect(), 100) : false;
      const bounds = boundsRef?.current?.getBoundingClientRect();

      setIsNearMenu((currentIsNearMenu) => (currentIsNearMenu === nextIsNearMenu ? currentIsNearMenu : nextIsNearMenu));

      if (bounds && !isPointInsideRect(e.clientX, e.clientY, bounds)) return;

      positionCursor(e.clientX, e.clientY);
    };

    const handleBoundsPointerEnter = (e) => {
      if (e.pointerType === "touch") return;
      positionCursor(e.clientX, e.clientY, true);
    };

    const boundsNode = boundsRef?.current;
    boundsNode?.addEventListener("pointerenter", handleBoundsPointerEnter);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      boundsNode?.removeEventListener("pointerenter", handleBoundsPointerEnter);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [boundsRef, mouseX, mouseY, project?._id, staticCentered, x, y]);

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
    if (staticCentered) return undefined;

    if (isNearMenu) {
      document.documentElement.dataset.projectCursorNearMenu = "true";
    } else {
      delete document.documentElement.dataset.projectCursorNearMenu;
    }

    return () => {
      delete document.documentElement.dataset.projectCursorNearMenu;
    };
  }, [isNearMenu, staticCentered]);

  if (!project || (!showWhenInactive && !isActive)) return null;

  const cursorOpacity = !isReady || isNearMenu ? 0 : isActive ? 1 : inactiveOpacity;

  return (
    <motion.div
      ref={ref}
      typo="h2"
      style={{
        "--project-cursor-title-width": titleWidth,
        position: "fixed",
        left: staticCentered ? "50%" : 0,
        top: staticCentered ? "50%" : 0,
        x: staticCentered ? undefined : x,
        y: staticCentered ? undefined : y,
        translateX: "-50%",
        translateY: "-50%",
        pointerEvents: "none",
        transformOrigin: "center",
        zIndex: 1000,
      }}
      className={[styles.cursor, staticCentered ? styles.staticCursor : null, className].filter(Boolean).join(" ")}
      animate={{ opacity: cursorOpacity, scale: isNearMenu ? 0 : 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      initial={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <span className={styles.title} ref={titleRef}>
        {project.title}
      </span>
      <AnimatePresence>
        {showPreview && isActive && (previewMedia.gallery.length || previewMedia.medium) ? (
          <motion.span
            className={`${styles.preview} ${staticCentered ? styles.staticPreview : ""}`}
            key={project._id || project.title}
            initial={{ opacity: 0, scale: 0, y: staticCentered ? 0 : "-50%" }}
            animate={{ opacity: 1, scale: 1, y: staticCentered ? 0 : "-50%" }}
            exit={{ opacity: 0, scale: 0, y: staticCentered ? 0 : "-50%" }}
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
