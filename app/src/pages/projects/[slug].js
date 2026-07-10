import { useEffect, useState } from "react";

import NextProject from "@/components/NextProject/NextProject";
import Media from "@/components/Media/Media";
import Section from "@/components/Section/Section";

import ScaleGallery from "@/components/Project/ScaleGallery/ScaleGallery";

import { buildPage } from "@/components/Project/buildPage";

import Credits from "@/components/Credits/Credits";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";

import { getProjectStaticPaths, getProjectStaticProps } from "@/lib/sanity/fetch";

import styles from "@/styles/Project.module.css";

function getPlainText(blocks) {
  if (!Array.isArray(blocks)) return "";

  return blocks
    .map((block) => block.children?.map((child) => child.text).join("") || "")
    .filter(Boolean)
    .join("\n\n");
}

function formatDate(scheduling) {
  return [scheduling?.month, scheduling?.year].filter(Boolean).join("/");
}

function getLinkHref(link) {
  return link?.url || link?.href || link?.link || "";
}

export default function Project({ nextProject, project }) {
  const [isNextProjectHovered, setIsNextProjectHovered] = useState(false);
  const description = getPlainText(project?.description);
  const date = formatDate(project?.scheduling);
  const projectLink = getLinkHref(project?.link);
  const categories = project?.categories?.filter((category) => category?.name) || [];
  const credits = project?.credits?.filter((credit) => credit?.role || credit?.entries?.length) || [];
  const pageBuilder = project?.pageBuilder || [];
  const galleryRows =
    project?.gallery
      ?.map((row) => ({
        ...row,
        media: row?.media?.filter((item) => item?.medium) || [],
      }))
      .filter((row) => row.media.length) || [];
  const cursorProject = isNextProjectHovered && nextProject ? nextProject : project;

  useEffect(() => {
    setIsNextProjectHovered(false);
  }, [project?._id]);

  return (
    <div className="page">
      <ProjectCursor isActive={isNextProjectHovered} project={cursorProject} />
      <main className="main">
        <article className={styles.project}>
          {/* <header className={styles.header}>
            <Marquee typo="h1" string={project.title} />
            <div className={styles.meta} typo="fineprint">
              {project?.client ? <p>{project.client}</p> : null}
              {date ? <p>{date}</p> : null}
              {project?.scheduling?.location ? <p>{project.scheduling.location}</p> : null}
            </div>
          </header> */}

          <div>{project?.coverMedia ? <Media medium={project.coverMedia.medium} eager /> : null}</div>

          <Section>
            {description ? (
              <div className={styles.descriptionContainer}>
                <p className={styles.description} typo="longcopy">
                  {description}
                </p>

                <div typo="h5" className={styles.subcaption}>
                  <div>Rotterdam, 06/2025</div>
                  <div>Nieuwe Instituut, 06/2025</div>
                  <div>Exhibition Design, Animation</div>
                </div>
              </div>
            ) : null}
          </Section>

          {pageBuilder.length ? <Section>{pageBuilder.map((block) => buildPage(block))}</Section> : null}
          {/* {categories.length ? (
            <ul className={styles.inlineList}>
              {categories.map((category) => (
                <li key={category._id || category.name}>{category.name}</li>
              ))}
            </ul>
          ) : null} */}

          {/* {galleryRows.length ? (
            <Section className={styles.gallery}>
              {galleryRows.map((row, rowIndex) => (
                <div
                  className={styles.galleryRow}
                  key={row._key || `gallery-row-${rowIndex}`}
                  style={{ "--columns": row.media.length }}
                >
                  {row.media.map((item, index) => (
                    <Media
                      className={styles.mediaItem}
                      medium={item.medium}
                      key={`${item?.medium?._id || "media"}-${index}`}
                    />
                  ))}
                </div>
              ))}
            </Section>
          ) : null} */}

          {credits.length ? (
            <Section>
              <Credits credits={credits} />
            </Section>
          ) : null}

          <NextProject
            onHoverEnd={() => setIsNextProjectHovered(false)}
            onHoverStart={() => setIsNextProjectHovered(true)}
            project={nextProject}
          />
        </article>
      </main>
    </div>
  );
}

export const getStaticPaths = getProjectStaticPaths;
export const getStaticProps = getProjectStaticProps;
