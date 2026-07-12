import { useState } from "react";

import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Info.module.css";

import Text from "@/components/Text/Text";
import CyclingMedia from "@/components/Media/CyclingMedia";

import SectionSmall from "@/components/Section/SectionSmall";

import Footer from "@/components/Footer/Footer";
import ProjectCursor from "@/components/ProjectCursor/ProjectCursor";

function getEntryDate(entry) {
  return [entry?.scheduling?.month, entry?.scheduling?.year || entry?.year].filter(Boolean).join("/");
}

function InfoList({ entries, onEntryHover, title }) {
  if (!entries?.length) return null;

  return (
    <SectionSmall>
      <h2 typo="fineprint">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry._id} typo="h4" className={styles.listEntry}>
            <div
              className={styles.listEntryButton}
              onBlur={() => onEntryHover(null)}
              onFocus={() => onEntryHover(entry)}
              onMouseEnter={() => onEntryHover(entry)}
              onMouseLeave={() => onEntryHover(null)}
              tabIndex={0}
            >
              <CyclingMedia className={styles.thumbnail} gallery={entry.gallery} medium={entry.thumbnail?.medium} />
              <span className={styles.title}>
                {entry.title}
                {/* {getEntryDate(entry) ? `, ${getEntryDate(entry)}` : null} */}
                {entry.scheduling?.location || entry.location ? `, ${entry.scheduling?.location || entry.location}` : null}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionSmall>
  );
}

export default function Info({ experience, info, lastUpdatedAt, publicity }) {
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const recommendations = info.recommendations || info.Recommendations;

  return (
    <div className={`page ${styles.page}`}>
      <ProjectCursor isActive={Boolean(hoveredEntry)} project={hoveredEntry} showWhenInactive={false} />
      <main className={`main ${styles.content} ${hoveredEntry ? styles.contentDimmed : ""}`}>
        <div className={styles.infoContainer}>
          <div className={styles.intro}>
            <SectionSmall>
              <Text text={info.description} typo="fineprint" />
            </SectionSmall>
            <InfoList entries={experience} onEntryHover={setHoveredEntry} title="Experience" />
            <InfoList entries={publicity} onEntryHover={setHoveredEntry} title="Publicity" />

            <Text
              text="Patrick has lived and worked in Germany, Ireland, The Netherlands, Finland, Italy and Austria for extended periods."
              typo="fineprint"
            />
          </div>

          <div className={styles.details} typo="fineprint">
            {info.socials && (
              <div className={styles.socialAccount}>
                {info.socials.map((social) => (
                  <>
                    <a href={social.link}>{social.platform}</a> <br />
                  </>
                ))}
              </div>
            )}

            {info.VATNumber && <div>{info.VATNumber}</div>}

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

            <div>
              Commissions and General Enquiries:
              <a href="mailto:hutchinsonpatrick@icloud.com">hutchinsonpatrick@icloud.com</a>
            </div>
          </div>
        </div>
      </main>

      <Footer className={`${styles.footer} ${hoveredEntry ? styles.contentDimmed : ""}`} lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
