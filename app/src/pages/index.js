import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { getHomeStaticProps } from "@/lib/sanity/fetch";

import ImageView from "@/components/ImageView/ImageView";
import ScaleList from "@/components/ScaleList/ScaleList";

import styles from "@/styles/Index.module.css";

export default function Home({ activeFilter, home }) {
  const [view, setView] = useState("list");
  const selection = home?.selection || [];
  const filteredSelection = useMemo(
    () => (activeFilter ? selection.filter((entry) => entry._type === activeFilter) : selection),
    [activeFilter, selection],
  );

  useEffect(() => {
    document.documentElement.dataset.scaleListPage = "true";

    return () => {
      delete document.documentElement.dataset.scaleListPage;
    };
  }, []);

  if (!home || home.length === 0) return null;

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={view}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {view === "list" ? <ScaleList array={filteredSelection} /> : <ImageView array={filteredSelection} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className={styles.viewToggle} typo="fineprint" aria-label="View options">
        <button
          className={view === "list" ? styles.viewToggleButtonActive : styles.viewToggleButton}
          onClick={() => setView("list")}
          type="button"
        >
          List
        </button>
        <button
          className={view === "image" ? styles.viewToggleButtonActive : styles.viewToggleButton}
          onClick={() => setView("image")}
          type="button"
        >
          Image
        </button>
      </div>
    </div>
  );
}

export const getStaticProps = getHomeStaticProps;
