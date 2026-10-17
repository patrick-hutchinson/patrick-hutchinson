import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Info.module.css";

import Text from "@/components/Text/Text";
import CyclingMedia from "@/components/Media/CyclingMedia";

import SectionSmall from "@/components/Section/SectionSmall";
import Section from "@/components/Section/Section";

import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";

const ENTRY_SCROLL_THRESHOLD = 80;

const infoLabels = {
  en: {
    contact: "Contact",
    currentLocation: "Basel, Switzerland",
    currentlyIn: "Currently in",
    downloadCV: "Download CV",
    downloadRecommendations: "Download Recommendations",
    downloads: "Downloads",
    experience: "Experience",
    publicity: "Publicity",
    scrollNotice: "Scroll to see next",
    selected: "Selected",
    socials: "Socials",
  },
  de: {
    contact: "Kontakt",
    currentLocation: "Basel, Schweiz",
    currentlyIn: "Aktuell in",
    downloadCV: "CV herunterladen",
    downloadRecommendations: "Empfehlungen herunterladen",
    downloads: "Downloads",
    experience: "Erfahrung",
    publicity: "Publikationen",
    scrollNotice: "Scrollen, um den nächsten Eintrag zu sehen",
    selected: "Ausgewählte",
    socials: "Soziale Medien",
  },
};

const infoPortableTextComponents = {
  marks: {
    ammendum: ({ children }) => (
      <span className={`${styles.location} ${styles.ammendum}`} typo="caption">
        {children}
      </span>
    ),
  },
};

function getEntryDate(entry) {
  return [entry?.scheduling?.month, entry?.scheduling?.year || entry?.year].filter(Boolean).join("/");
}

function InfoList({ entries, isMobile, labels, onEntryHover, onEntryTap, title }) {
  if (!entries?.length) return null;

  return (
    <SectionSmall>
      <h2 typo="caption" className={styles.sectionHeadline}>
        {labels.selected} {title}
      </h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry._id} typo="body-small" className={styles.listEntry}>
            <div
              className={styles.listEntryButton}
              onBlur={() => {
                if (!isMobile) onEntryHover(null);
              }}
              onClick={(event) => {
                if (!isMobile) return;

                event.stopPropagation();
                onEntryTap(entry);
              }}
              onFocus={() => {
                if (!isMobile) onEntryHover(entry);
              }}
              onMouseEnter={() => {
                if (!isMobile) onEntryHover(entry);
              }}
              onMouseLeave={() => {
                if (!isMobile) onEntryHover(null);
              }}
              tabIndex={0}
            >
              <span className={styles.date} typo="caption">
                {getEntryDate(entry) ? `‘${getEntryDate(entry).slice(2)}` : null}
              </span>

              <span className={styles.thumbnailSlot}>
                <CyclingMedia className={styles.thumbnail} gallery={entry.gallery} medium={entry.thumbnail?.medium} />
              </span>

              <span className={`${styles.title} link`}>{entry.title}</span>
              <span className={styles.location} typo="caption">
                {entry.scheduling?.location || entry.location ? `${entry.scheduling?.location || entry.location}` : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionSmall>
  );
}

export default function Info({ experience, info, language = "en", publicity }) {
  const { isMobile } = useContext(DeviceContext);
  const labels = infoLabels[language] || infoLabels.en;
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [hasUsedMobileEntryScroll, setHasUsedMobileEntryScroll] = useState(false);
  const scrollAccumulator = useRef(0);
  const touchY = useRef(null);
  const recommendations = info.recommendations || info.Recommendations;
  const entries = useMemo(() => [...(experience || []), ...(publicity || [])], [experience, publicity]);
  const activeEntry = isMobile ? selectedEntry : hoveredEntry;

  const cycleEntry = (direction) => {
    if (!selectedEntry || !entries.length) return;

    const currentIndex = entries.findIndex((entry) => entry._id === selectedEntry._id);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + entries.length) % entries.length;
    setSelectedEntry(entries[nextIndex]);
  };

  const handleMobileDelta = (deltaY) => {
    if (!isMobile || !selectedEntry) return;

    scrollAccumulator.current += deltaY;

    if (Math.abs(scrollAccumulator.current) < ENTRY_SCROLL_THRESHOLD) return;

    cycleEntry(scrollAccumulator.current > 0 ? 1 : -1);
    setHasUsedMobileEntryScroll(true);
    scrollAccumulator.current = 0;
  };

  const handleEntryTap = (entry) => {
    if (selectedEntry) {
      setSelectedEntry(null);
      return;
    }

    setSelectedEntry(entry);
  };

  const handlePageClick = () => {
    if (isMobile && selectedEntry) setSelectedEntry(null);
  };

  const handleTouchStart = (event) => {
    if (!isMobile || !selectedEntry) return;

    touchY.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (!isMobile || !selectedEntry || touchY.current === null) return;

    event.preventDefault();

    const nextY = event.touches[0]?.clientY;
    if (typeof nextY !== "number") return;

    handleMobileDelta(touchY.current - nextY);
    touchY.current = nextY;
  };

  const handleTouchEnd = () => {
    touchY.current = null;
  };

  const handleWheel = (event) => {
    if (!isMobile || !selectedEntry) return;

    event.preventDefault();
    handleMobileDelta(event.deltaY);
  };

  useEffect(() => {
    if (isMobile && selectedEntry) {
      document.documentElement.dataset.infoPreviewOpen = "true";
    } else {
      delete document.documentElement.dataset.infoPreviewOpen;
    }

    return () => {
      delete document.documentElement.dataset.infoPreviewOpen;
    };
  }, [isMobile, selectedEntry]);

  return (
    <div
      className={`page ${styles.page}`}
      onClick={handlePageClick}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <AnimatePresence>
        {activeEntry ? (
          <ProjectCursor
            key={activeEntry._id}
            isActive
            project={activeEntry}
            showWhenInactive={false}
            staticCentered={isMobile}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isMobile && selectedEntry && !hasUsedMobileEntryScroll ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.scrollNotice}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            typo="caption"
          >
            {labels.scrollNotice}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <main className={`main ${styles.content} ${activeEntry ? styles.contentDimmed : ""}`}>
        <div className={styles.infoContainer}>
          <div className={styles.intro}>
            <SectionSmall>
              <Text
                components={infoPortableTextComponents}
                text={info.description}
                typo="body-small"
                style={{ fontWeight: "normal" }}
              />
            </SectionSmall>
            <InfoList
              entries={experience}
              isMobile={isMobile}
              labels={labels}
              onEntryHover={setHoveredEntry}
              onEntryTap={handleEntryTap}
              title={labels.experience}
            />
            <InfoList
              entries={publicity}
              isMobile={isMobile}
              labels={labels}
              onEntryHover={setHoveredEntry}
              onEntryTap={handleEntryTap}
              title={labels.publicity}
            />

            <section className={styles.details}>
              <section typo="caption">
                <h4 typo="caption">{labels.contact}</h4>
                <a typo="caption" href="mailto:hutchinsonpatrick@icloud.com">
                  hutchinsonpatrick@icloud.com
                </a>{" "}
                <br />
                <a>+49 (0) 159 01297272</a>
              </section>

              {info.socials && (
                <section typo="caption">
                  <h4 typo="caption">{labels.socials}</h4>
                  {info.socials.map((social) => (
                    <>
                      <a href={social.link} target="_blank">
                        {social.platform}
                      </a>
                      <br />
                    </>
                  ))}
                </section>
              )}

              <section typo="caption">
                <h4 typo="caption">{labels.downloads}</h4>
                {info.CV?.asset?.url ? (
                  <div>
                    <a href={info.CV.asset.url} download={info.CV.asset.originalFilename || undefined}>
                      {labels.downloadCV}
                    </a>
                  </div>
                ) : null}

                {recommendations?.asset?.url ? (
                  <div>
                    <a href={recommendations.asset.url} download={recommendations.asset.originalFilename || undefined}>
                      {labels.downloadRecommendations}
                    </a>
                  </div>
                ) : null}
              </section>

              <section typo="caption">
                <h4 typo="caption">{labels.currentlyIn}</h4>
                <a
                  href="https://www.google.com/maps/@47.5540216,7.5824834,277a,75y,263.39h,90.24t/data=!3m7!1e1!3m5!1s5f0zpKRYscyDHEILJ_W7aQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-0.24051115385469757%26panoid%3D5f0zpKRYscyDHEILJ_W7aQ%26yaw%3D263.3919012677985!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MTAxMy4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                >
                  {labels.currentLocation}
                </a>
              </section>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
