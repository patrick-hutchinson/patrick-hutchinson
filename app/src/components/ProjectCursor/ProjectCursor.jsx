import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import Media from "@/components/Media/Media";

import styles from "./ProjectCursor.module.css";

function getPreviewMedium(project) {
  return project?.coverMedia?.medium || project?.thumbnail?.medium || project?.medium;
}

const ProjectCursor = ({ isActive = false, project, showWhenInactive = true }) => {
  const ref = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const previewMedium = getPreviewMedium(project);

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

  if (!project || (!showWhenInactive && !isActive)) return null;

  return (
    <motion.div
      ref={ref}
      typo="h2"
      style={{
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
      animate={{ opacity: isReady ? (isActive ? 1 : "var(--opacity)") : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <span className={styles.title}>{project.title}</span>
      <AnimatePresence>
        {isActive && previewMedium ? (
          <motion.span
            className={styles.preview}
            key={previewMedium._id || project.title}
            initial={{ opacity: 0, scale: 0, y: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0, y: "-50%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Media className={styles.previewMedia} medium={previewMedium} eager />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectCursor;
