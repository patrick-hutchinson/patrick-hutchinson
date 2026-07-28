import { useContext, useEffect, useRef, useState } from "react";

import NextProject from "@/components/NextProject/NextProject";
import Media from "@/components/Media/Media";
import Marquee from "@/components/Marquee/Marquee";
import Section from "@/components/Section/Section";

import DescriptionReveal from "@/components/Project/DescriptionReveal/DescriptionReveal";

import { buildPage } from "@/components/Project/buildPage";

import Credits from "@/components/Credits/Credits";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";

import { DeviceContext } from "@/context/DeviceContext";
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
  const { isMobile } = useContext(DeviceContext);
  const coverMediaRef = useRef(null);
  const [isCoverMediaHovered, setIsCoverMediaHovered] = useState(false);
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

  const coverMedia = isMobile ? project?.coverMedia_mobile || project?.coverMedia : project?.coverMedia;

  useEffect(() => {
    setIsCoverMediaHovered(false);
  }, [project?._id]);

  return (
    <div className={`page ${styles.page}`}>
      {!isMobile ? (
        <ProjectCursor
          activeOpacity="var(--opacity)"
          boundsRef={coverMediaRef}
          inactiveOpacity={0}
          isActive={isCoverMediaHovered}
          project={project}
          showPreview={false}
        />
      ) : null}
      <main className="main">
        <article className={styles.project}>
          <div
            className={styles.coverCursorArea}
            onMouseEnter={() => setIsCoverMediaHovered(true)}
            onMouseLeave={() => setIsCoverMediaHovered(false)}
            ref={coverMediaRef}
          >
            {coverMedia ? <Media className={styles.coverMedia} medium={coverMedia.medium} eager /> : null}
          </div>

          <Section>
            {description ? (
              <div className={styles.descriptionContainer}>
                <DescriptionReveal className={styles.description} text={description} />

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
            <Section>
              {pageBuilder.map((block) => buildPage(block, { fallbackSubcaption: schedulingSubcaption, isMobile }))}
            </Section>
          ) : null}

          {credits.length ? (
            <Section>
              <Credits credits={credits} />
            </Section>
          ) : null}

          {projectLink ? (
            <Section>
              <div typo="h5">Link</div>
              <a href={projectLink} target="_blank" rel="noreferrer">
                <Marquee canDrag={false} reliableLoop string={projectLink} typo="h1" />
              </a>
            </Section>
          ) : null}

          <NextProject
            lastUpdatedAt={lastUpdatedAt}
            project={nextProject}
          />
        </article>
      </main>
    </div>
  );
}

export const getStaticPaths = getProjectStaticPaths;
export const getStaticProps = getProjectStaticProps;
