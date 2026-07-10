import { useState } from "react";

import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Info.module.css";

import Text from "@/components/Text/Text";
import Media from "@/components/Media/Media";

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
          <li key={entry._id} typo="fineprint" className={styles.listEntry}>
            <button
              className={styles.listEntryButton}
              onBlur={() => onEntryHover(null)}
              onFocus={() => onEntryHover(entry)}
              onMouseEnter={() => onEntryHover(entry)}
              onMouseLeave={() => onEntryHover(null)}
              type="button"
            >
              {entry.thumbnail && <Media className={styles.thumbnail} medium={entry.thumbnail.medium} />}
              {entry.title}
              {getEntryDate(entry) ? `, ${getEntryDate(entry)}` : null}
              {entry.scheduling?.location || entry.location ? `, ${entry.scheduling?.location || entry.location}` : null}
            </button>
          </li>
        ))}
      </ul>
    </SectionSmall>
  );
}

export default function Info({ experience, info, lastUpdatedAt, publicity }) {
  const [hoveredEntry, setHoveredEntry] = useState(null);

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

            <div>
              Commissions and General Enquiries:
              <a href="mailto:hutchinsonpatrick@icloud.com">hutchinsonpatrick@icloud.com</a>
            </div>
          </div>
        </div>
      </main>

      <Footer
        className={`${styles.footer} ${hoveredEntry ? styles.contentDimmed : ""}`}
        lastUpdatedAt={lastUpdatedAt}
      />
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
