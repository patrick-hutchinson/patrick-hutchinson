import Link from "next/link";

import styles from "./NextProject.module.css";

const NextProject = ({ onHoverEnd, onHoverStart, project }) => {
  if (!project?.slug?.current) return null;

  return (
    <Link
      aria-label={`Next project: ${project.title}`}
      className={styles.nextProjectContainer}
      href={`/projects/${project.slug.current}`}
      onBlur={onHoverEnd}
      onFocus={onHoverStart}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div typo="h2">Next Project:</div>
      <span className={styles.nextProjectLabel}>{project.title}</span>
    </Link>
  );
};

export default NextProject;
