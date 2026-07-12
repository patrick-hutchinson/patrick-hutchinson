import { useEffect, useState } from "react";

import NextProject from "@/components/NextProject/NextProject";
import Media from "@/components/Media/Media";
import Marquee from "@/components/Marquee/Marquee";
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

export default function Project({ lastUpdatedAt, nextProject, project }) {
  const [isNextProjectHovered, setIsNextProjectHovered] = useState(false);
  const description = getPlainText(project?.description);
  const date = formatDate(project?.scheduling);
  const schedulingSubcaption = [project?.scheduling?.location, date].filter(Boolean).join(", ");
  const projectLink = getLinkHref(project?.link);
  const categories = project?.categories?.filter((category) => category?.name) || [];
  const subcaptionItems = [
    schedulingSubcaption,
    project?.client,
    categories.map((category) => category.name).join(", "),
  ].filter(Boolean);
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
    <div className={`page ${styles.page}`}>
      <ProjectCursor isActive={isNextProjectHovered} project={cursorProject} />
      <main className="main">
        <article className={styles.project}>
          <div>
            {project?.coverMedia ? <Media className={styles.coverMedia} medium={project.coverMedia.medium} eager /> : null}
          </div>

          <Section>
            {description ? (
              <div className={styles.descriptionContainer}>
                <p className={styles.description} typo="longcopy">
                  {description}
                </p>

                {subcaptionItems.length ? (
                  <div typo="h5" className={styles.subcaption}>
                    {subcaptionItems.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </Section>

          {pageBuilder.length ? (
            <Section>{pageBuilder.map((block) => buildPage(block, { fallbackSubcaption: schedulingSubcaption }))}</Section>
          ) : null}
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

          {projectLink ? (
            <Section>
              <div typo="h5">Link</div>
              <a href={projectLink} target="_blank" rel="noreferrer">
                <Marquee string={projectLink} typo="h1" />
              </a>
            </Section>
          ) : null}

          <NextProject
            lastUpdatedAt={lastUpdatedAt}
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
