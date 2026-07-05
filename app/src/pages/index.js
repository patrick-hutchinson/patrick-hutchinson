import { getHomeStaticProps } from "@/lib/sanity/fetch";

import styles from "@/styles/Index.module.css";

import ScaleList from "@/components/ScaleList/ScaleList";
import FilterMenu from "@/components/FilterMenu/FilterMenu";
import Copyright from "@/components/Copyright/Copyright";

export default function Home({ home }) {
  const selection = home?.selection || [];

  if (!home || home.length === 0) return null;

  const filterArray = [...new Set(selection.map((entry) => entry._type))];

  return (
    <div className={`${styles.page}`}>
      <main className={styles.main}>
        {/* <FilterMenu className={styles.filterMenu} array={filterArray} /> */}
        <ScaleList array={selection} />
        <Copyright className={styles.copyright} />
      </main>
    </div>
  );
}

export const getStaticProps = getHomeStaticProps;
