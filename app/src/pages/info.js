import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Info.module.css";

import Text from "@/components/Text/Text";
import CyclingMedia from "@/components/Media/CyclingMedia";

import SectionSmall from "@/components/Section/SectionSmall";
import Section from "@/components/Section/Section";

import Footer from "@/components/Footer/Footer";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";
import { DeviceContext } from "@/context/DeviceContext";

const ENTRY_SCROLL_THRESHOLD = 80;

function getEntryDate(entry) {
  return [entry?.scheduling?.month, entry?.scheduling?.year || entry?.year].filter(Boolean).join("/");
}

function InfoList({ entries, isMobile, onEntryHover, onEntryTap, title }) {
  if (!entries?.length) return null;

  return (
    <SectionSmall>
      <h2 typo="fineprint">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry._id} typo="h4" className={styles.listEntry}>
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
              <span className={styles.thumbnailSlot}>
                <CyclingMedia className={styles.thumbnail} gallery={entry.gallery} medium={entry.thumbnail?.medium} />
              </span>

              <span className={styles.date} typo="fineprint">
                {getEntryDate(entry) ? `‘${getEntryDate(entry).slice(2)}` : null}
              </span>

              <span className={styles.title}>{entry.title}</span>
              <span className={styles.location} typo="fineprint">
                {entry.scheduling?.location || entry.location ? `${entry.scheduling?.location || entry.location}` : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionSmall>
  );
}

export default function Info({ experience, info, lastUpdatedAt, publicity }) {
  const { isMobile } = useContext(DeviceContext);
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
            typo="fineprint"
          >
            Scroll to see next
          </motion.div>
        ) : null}
      </AnimatePresence>
      <main className={`main ${styles.content} ${activeEntry ? styles.contentDimmed : ""}`}>
        <div className={styles.infoContainer}>
          <div className={styles.intro}>
            <SectionSmall>
              <Text text={info.description} typo="h4" />
            </SectionSmall>
            <InfoList
              entries={experience}
              isMobile={isMobile}
              onEntryHover={setHoveredEntry}
              onEntryTap={handleEntryTap}
              title="Experience"
            />
            <InfoList
              entries={publicity}
              isMobile={isMobile}
              onEntryHover={setHoveredEntry}
              onEntryTap={handleEntryTap}
              title="Publicity"
            />

            <Section>
              <Text
                text="Patrick has lived and worked in Germany, Ireland, Switzerland, The Netherlands, Finland, Austria and Italy for extended periods."
                typo="h4"
              />
            </Section>

            <section className={styles.details}>
              <section typo="fineprint">
                <h4 typo="fineprint">Contact</h4>
                <a typo="fineprint" href="mailto:hutchinsonpatrick@icloud.com">
                  hutchinsonpatrick@icloud.com
                </a>{" "}
                <br />
                <a>+49 (0) 159 01297272</a>
              </section>

              {info.socials && (
                <section typo="fineprint">
                  <h4 typo="fineprint">Socials</h4>
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

              <section typo="fineprint">
                <h4 typo="fineprint">Downloads</h4>
                {info.CV?.asset?.url ? (
                  <div>
                    <a href={info.CV.asset.url} download={info.CV.asset.originalFilename || undefined}>
                      Download CV
                    </a>
                  </div>
                ) : null}

                {recommendations?.asset?.url ? (
                  <div>
                    <a href={recommendations.asset.url} download={recommendations.asset.originalFilename || undefined}>
                      Download Recommendations
                    </a>
                  </div>
                ) : null}
              </section>
            </section>
          </div>
        </div>
      </main>

      <Footer className={`${styles.footer} ${activeEntry ? styles.contentDimmed : ""}`} lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
