import Link from "next/link";

import styles from "./NextProject.module.css";
import Footer from "../Footer/Footer";

const NextProject = ({ lastUpdatedAt, onHoverEnd, onHoverStart, project }) => {
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
      scroll={false}
    >
      <div typo="h2" className={styles.nextProjectHeader}>
        Next Project:
      </div>
      <span className={styles.nextProjectLabel}>{project.title}</span>

      <Footer className={styles.footer} lastUpdatedAt={lastUpdatedAt} />
    </Link>
  );
};

export default NextProject;
