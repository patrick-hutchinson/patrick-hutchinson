import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { fallbackSiteData } from "@/lib/sanity";
import Copyright from "@/components/Copyright/Copyright";
import FilterMenu from "@/components/FilterMenu/FilterMenu";
import Menu from "@/components/Menu/Menu";
import "@/styles/globals.css";
import "@/styles/fonts.css";

const pageTransitionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: (scrollY) => ({
    opacity: 0,
    position: "fixed",
    top: -scrollY,
    left: 0,
    right: 0,
    width: "100%",
    pointerEvents: "none",
  }),
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const site = pageProps.site || fallbackSiteData;
  const [exitingScrollY, setExitingScrollY] = useState(0);
  const [indexView, setIndexView] = useState("list");
  const isIndexPage = router.pathname === "/";
  // const [activeFilter, setActiveFilter] = useState(null);
  // const filterArray = useMemo(() => {
  //   const selection = pageProps.home?.selection || [];

  //   return [...new Set(selection.map((entry) => entry._type))];
  // }, [pageProps.home?.selection]);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setExitingScrollY(window.scrollY);
    };

    const handleRouteChangeComplete = () => {
      window.scrollTo(0, 0);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>
      <ViewportProvider>
        <DeviceProvider>
          <LenisProvider>
            <div className="controls">
              {/* {filterArray.length ? (
                <FilterMenu activeFilter={activeFilter} array={filterArray} onFilterChange={setActiveFilter} />
              ) : null} */}
              <Menu />
              {isIndexPage ? (
                <div className="viewToggle" typo="fineprint" aria-label="View options">
                  <button
                    className={indexView === "list" ? "viewToggleButtonActive" : "viewToggleButton"}
                    onClick={() => setIndexView("list")}
                    type="button"
                  >
                    List
                  </button>
                  <button
                    className={indexView === "image" ? "viewToggleButtonActive" : "viewToggleButton"}
                    onClick={() => setIndexView("image")}
                    type="button"
                  >
                    Image
                  </button>
                </div>
              ) : null}
            </div>
            <div className="pageTransitionRoot">
              <AnimatePresence custom={exitingScrollY} initial={false}>
                <motion.div
                  animate="animate"
                  className="pageTransition"
                  custom={exitingScrollY}
                  exit="exit"
                  initial="initial"
                  key={router.asPath}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  variants={pageTransitionVariants}
                >
                  <Component
                    {...pageProps}
                    indexView={indexView}
                    setIndexView={setIndexView}
                    // activeFilter={activeFilter}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </LenisProvider>
        </DeviceProvider>
      </ViewportProvider>
    </>
  );
}
