import Link from "next/link";

import { getInfoStaticProps } from "@/lib/sanity/fetch";
import styles from "@/styles/Index.module.css";

export default function Info({ info }) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Info</h1>
          {info?.contact?.length ? (
            <div>
              {info.contact.map((item) => (
                <p key={`${item.platform}-${item.link}`}>
                  {item.platform}: {item.link}
                </p>
              ))}
            </div>
          ) : (
            <p>No info content has been published yet.</p>
          )}
        </div>
        <div className={styles.ctas}>
          <Link className={styles.secondary} href="/">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps = getInfoStaticProps;
