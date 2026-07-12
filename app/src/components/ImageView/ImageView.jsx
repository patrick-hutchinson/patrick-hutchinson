import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import Media from "@/components/Media/Media";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";

import styles from "./ImageView.module.css";

const SCROLL_SENSITIVITY = 1;

function wrap(value, max) {
  if (max <= 0) return 0;
  return ((value % max) + max) % max;
}

const ImageView = ({ array }) => {
  const { isMobile } = useContext(DeviceContext);
  const projects = useMemo(
    () => array.filter((entry) => entry?._type === "project" && entry?.coverMedia?.medium && entry?.slug?.current),
    [array],
  );
  const virtualY = useRef(0);
  const touchY = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
  const usesMobileCover = isMobile && Boolean(activeProject?.coverMedia_mobile);
  const coverMedia = usesMobileCover ? activeProject?.coverMedia_mobile : activeProject?.coverMedia;
  const medium = coverMedia?.medium;

  if (!projects.length) return null;

  return (
    <div
      className={styles.imageView}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <ProjectCursor className={styles.cursor} isActive project={activeProject} showPreview={false} />
      <Link
        className={styles.mediaLink}
        href={`/projects/${activeProject.slug.current}`}
        scroll={false}
      >
        <motion.div
          animate={{ scale: 1 }}
          className={[styles.mediaFrame, usesMobileCover ? styles.mobileMediaFrame : null].filter(Boolean).join(" ")}
          initial={{ scale: 0.96 }}
          key={activeProject._id}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Media className={styles.media} medium={medium} eager />
        </motion.div>
      </Link>
    </div>
  );
};

export default ImageView;
