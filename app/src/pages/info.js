import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Info.module.css";

import Text from "@/components/Text/Text";
import Media from "@/components/Media/Media";

import SectionSmall from "@/components/Section/SectionSmall";

function getEntryDate(entry) {
  return [entry?.scheduling?.month, entry?.scheduling?.year || entry?.year].filter(Boolean).join("/");
}

function InfoList({ entries, title }) {
  if (!entries?.length) return null;

  return (
    <SectionSmall>
      <h2 typo="fineprint">{title}</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry._id} typo="fineprint" className={styles.listEntry}>
            {entry.thumbnail && <Media className={styles.thumbnail} medium={entry.thumbnail.medium} />}
            {entry.title}
            {getEntryDate(entry) ? `, ${getEntryDate(entry)}` : null}
            {entry.scheduling?.location || entry.location ? `, ${entry.scheduling?.location || entry.location}` : null}
          </li>
        ))}
      </ul>
    </SectionSmall>
  );
}

export default function Info({ experience, info, publicity }) {
  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <div className={styles.infoContainer}>
          <div className={styles.intro}>
            <SectionSmall>
              <Text text={info.description} typo="fineprint" />
            </SectionSmall>
            <InfoList entries={experience} title="Experience" />
            <InfoList entries={publicity} title="Publicity" />

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

        <div className={styles.lastUpdated} typo="fineprint">
          Site was last updated.
        </div>
      </main>
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
