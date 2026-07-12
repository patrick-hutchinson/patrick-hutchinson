import Link from "next/link";
import { AnimatePresence, useInView } from "framer-motion";
import { useContext, useRef } from "react";

import styles from "./NextProject.module.css";
import Footer from "../Footer/Footer";
import ProjectCursor from "../ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";

const NextProject = ({ lastUpdatedAt, onHoverEnd, onHoverStart, project }) => {
  const { isMobile } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.75 });

  if (!project?.slug?.current) return null;

  return (
    <>
      <AnimatePresence>
        {isMobile && isInView ? (
          <ProjectCursor key={project._id || project.slug.current} isActive project={project} staticCentered />
        ) : null}
      </AnimatePresence>
      <Link
        aria-label={`Next project: ${project.title}`}
        className={styles.nextProjectContainer}
        href={`/projects/${project.slug.current}`}
        onBlur={onHoverEnd}
        onFocus={onHoverStart}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        ref={containerRef}
        scroll={false}
      >
        <div typo="h2" className={styles.nextProjectHeader}>
          Next Project:
        </div>

        <Footer className={styles.footer} lastUpdatedAt={lastUpdatedAt} />
      </Link>
    </>
  );
};

export default NextProject;
