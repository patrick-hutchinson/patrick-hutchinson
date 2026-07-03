import { getHomeStaticProps } from "@/lib/sanity/fetch";

import styles from "@/styles/Index.module.css";

import ListItem from "@/components/ScaleList/ScaleListItem";

import ScaleList from "@/components/ScaleList/ScaleList";

export default function Home({ home }) {
  const selection = home?.selection || [];

  if (!home || home.length === 0) return null;

  return (
    <div className={`${styles.page}`}>
      <main className={styles.main}>
        <ScaleList array={selection} />
      </main>
    </div>
  );
}

export const getStaticProps = getHomeStaticProps;
