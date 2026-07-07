import { useMemo } from "react";

import { getHomeStaticProps } from "@/lib/sanity/fetch";

import ScaleList from "@/components/ScaleList/ScaleList";

import styles from "@/styles/Index.module.css";

export default function Home({ activeFilter, home }) {
  const selection = home?.selection || [];

  if (!home || home.length === 0) return null;

  const filteredSelection = useMemo(
    () => (activeFilter ? selection.filter((entry) => entry._type === activeFilter) : selection),
    [activeFilter, selection],
  );

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <ScaleList array={filteredSelection} />
      </main>
    </div>
  );
}

export const getStaticProps = getHomeStaticProps;
