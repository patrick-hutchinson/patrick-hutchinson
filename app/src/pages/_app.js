import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { fallbackSiteData } from "@/lib/sanity";
import Copyright from "@/components/Copyright/Copyright";
import FilterMenu from "@/components/FilterMenu/FilterMenu";
import Menu from "@/components/Menu/Menu";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
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

function getLanguagePath(asPath, nextLanguage) {
  const [pathWithQuery, hash = ""] = asPath.split("#");
  const [path = "/", query = ""] = pathWithQuery.split("?");
  const segments = path.split("/").filter(Boolean);
  const pathWithoutLanguage = SUPPORTED_LANGUAGES.includes(segments[0]) ? `/${segments.slice(1).join("/")}` : path;
  const normalizedPath = pathWithoutLanguage === "/" ? "" : pathWithoutLanguage;

  return `/${nextLanguage}${normalizedPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const site = pageProps.site || fallbackSiteData;
  const language = pageProps.language || "en";
  const [exitingScrollY, setExitingScrollY] = useState(0);
  const [indexView, setIndexView] = useState("list");
  const isIndexPage = router.pathname === "/" || router.pathname === "/[language]";
  // const [activeFilter, setActiveFilter] = useState(null);
  // const filterArray = useMemo(() => {
  //   const selection = pageProps.home?.selection || [];

  //   return [...new Set(selection.map((entry) => entry._type))];
  // }, [pageProps.home?.selection]);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setExitingScrollY(window.scrollY);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
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
      <ThemeProvider attribute="data-theme" enableSystem={false} forcedTheme="light">
        <ViewportProvider>
          <DeviceProvider>
            <LenisProvider>
              <div className="controls">
                {/* {filterArray.length ? (
                <FilterMenu activeFilter={activeFilter} array={filterArray} onFilterChange={setActiveFilter} />
              ) : null} */}
                <Menu language={language} socials={site.socials} />
                <div className="languageToggle" typo="fineprint" aria-label="Language options">
                  <Link
                    className={language === "de" ? "languageToggleButtonActive" : "languageToggleButton"}
                    href={getLanguagePath(router.asPath, "de")}
                    scroll={false}
                  >
                    DE
                  </Link>
                  <Link
                    className={language === "en" ? "languageToggleButtonActive" : "languageToggleButton"}
                    href={getLanguagePath(router.asPath, "en")}
                    scroll={false}
                  >
                    EN
                  </Link>
                </div>
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
                    <button
                      className={indexView === "3d" ? "viewToggleButtonActive" : "viewToggleButton"}
                      onClick={() => setIndexView("3d")}
                      type="button"
                    >
                      3D
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
                    transition={{ duration: 1, ease: "easeInOut" }}
                    variants={pageTransitionVariants}
                  >
                    <Component
                      {...pageProps}
                      indexView={indexView}
                      language={language}
                      setIndexView={setIndexView}
                      // activeFilter={activeFilter}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </LenisProvider>
          </DeviceProvider>
        </ViewportProvider>
      </ThemeProvider>
    </>
  );
}
