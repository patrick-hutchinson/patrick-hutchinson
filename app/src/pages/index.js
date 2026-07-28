import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

import { getHomeStaticProps } from "@/lib/sanity/fetch";
import { preloadMedium } from "@/lib/media/projectThumbnails";

import ImageView from "@/components/ImageView/ImageView";
import ListView from "@/components/ListView/ListView";

import styles from "@/styles/Index.module.css";

export default function Home({ activeFilter, home, indexView = "list" }) {
  const preloadedMedia = useRef([]);
  const selection = home?.selection || [];
  const filteredSelection = useMemo(
    () => (activeFilter ? selection.filter((entry) => entry._type === activeFilter) : selection),
    [activeFilter, selection],
  );

  useEffect(() => {
    document.documentElement.dataset.listViewPage = "true";

    return () => {
      delete document.documentElement.dataset.listViewPage;
    };
  }, []);

  useEffect(() => {
    preloadedMedia.current = selection
      .filter((entry) => entry?._type === "project")
      .flatMap((project) => [project?.thumbnail?.medium, project?.thumbnail_mobile?.medium])
      .map((medium) => preloadMedium(medium))
      .filter(Boolean);
  }, [selection]);

  if (!home || home.length === 0) return null;

  return (
    <div className={`page ${styles.page}`}>
      <main className="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            animate={{ opacity: 1 }}
            className={[styles.view, indexView === "list" ? styles.listView : styles.imageView].join(" ")}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={indexView}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {indexView === "list" ? <ListView array={filteredSelection} /> : <ImageView array={filteredSelection} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export const getStaticProps = getHomeStaticProps;
