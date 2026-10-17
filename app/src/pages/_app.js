import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { CYLINDER_MODES } from "@/components/CylinderView/cylinderModes";
import { fallbackSiteData } from "@/lib/sanity/siteFallback";

import "@/styles/globals.css";
import "@/styles/fonts.css";

import Header from "@/components/Header/Header";

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

const focusColorPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const interactiveFocusSelector = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function normalizeFocusColorPair(entry) {
  if (typeof entry === "string" && focusColorPattern.test(entry)) {
    return {
      background: entry,
      foreground: "#0a0a0a",
    };
  }

  if (
    entry &&
    typeof entry === "object" &&
    focusColorPattern.test(entry.background) &&
    focusColorPattern.test(entry.foreground)
  ) {
    return {
      background: entry.background,
      foreground: entry.foreground,
    };
  }

  return null;
}

function getFocusColorPairs(site) {
  const colors = Array.isArray(site?.focusColors) ? site.focusColors : [];
  const validColorPairs = colors.map(normalizeFocusColorPair).filter(Boolean);

  return validColorPairs.length ? validColorPairs : fallbackSiteData.focusColors;
}

function getRandomFocusColorPair(colorPairs, currentColor) {
  if (colorPairs.length <= 1) return colorPairs[0];

  const nextColorPairs = colorPairs.filter((pair) => pair.background.toLowerCase() !== currentColor?.toLowerCase());
  return nextColorPairs[Math.floor(Math.random() * nextColorPairs.length)];
}

function applyFocusColorPair(root, colorPair) {
  root.style.setProperty("--focus", colorPair.background);
  root.style.setProperty("--focus-foreground", colorPair.foreground);
}

function applyFixedFocusColorPair(root, colorPair) {
  root.style.setProperty("--fixed-focus", colorPair.background);
  root.style.setProperty("--fixed-focus-foreground", colorPair.foreground);
}

function applySelectionFocusColorPair(root, colorPair) {
  root.style.setProperty("--selection-focus", colorPair.background);
  root.style.setProperty("--selection-focus-foreground", colorPair.foreground);
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const site = pageProps.site || fallbackSiteData;
  const language = pageProps.language || "en";
  const hasActiveSelectionRef = useRef(false);
  const [exitingScrollY, setExitingScrollY] = useState(0);
  const [cylinderMode, setCylinderMode] = useState(CYLINDER_MODES.TITLES);
  const isIndexPage = router.pathname === "/" || router.pathname === "/[language]";

  useEffect(() => {
    const handleRouteChangeStart = () => {
      setExitingScrollY(window.scrollY);
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

  useEffect(() => {
    const focusColorPairs = getFocusColorPairs(site);
    const root = document.documentElement;

    applyFocusColorPair(root, focusColorPairs[0]);
    applyFixedFocusColorPair(root, getRandomFocusColorPair(focusColorPairs));
    applySelectionFocusColorPair(root, getRandomFocusColorPair(focusColorPairs));

    const handleInteractivePointerOver = (event) => {
      if (!(event.target instanceof Element)) return;

      const interactiveElement = event.target.closest(interactiveFocusSelector);
      if (!interactiveElement || interactiveElement.closest("[data-focus-static='true']")) return;

      if (event.relatedTarget instanceof Node && interactiveElement.contains(event.relatedTarget)) return;

      applyFocusColorPair(
        root,
        getRandomFocusColorPair(focusColorPairs, root.style.getPropertyValue("--focus")),
      );
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const hasSelection = Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);

      if (hasSelection && !hasActiveSelectionRef.current) {
        applySelectionFocusColorPair(
          root,
          getRandomFocusColorPair(focusColorPairs, root.style.getPropertyValue("--selection-focus")),
        );
      }

      hasActiveSelectionRef.current = hasSelection;
    };

    document.addEventListener("pointerover", handleInteractivePointerOver, true);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("pointerover", handleInteractivePointerOver, true);
      document.removeEventListener("selectionchange", handleSelectionChange);
      hasActiveSelectionRef.current = false;
    };
  }, [site]);

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>
      <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
        <ViewportProvider>
          <DeviceProvider>
            <LenisProvider>
              <Header
                cylinderMode={cylinderMode}
                language={language}
                setCylinderMode={setCylinderMode}
                showCylinderModeToggle={isIndexPage}
                site={site}
              />
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
                      cylinderMode={cylinderMode}
                      language={language}
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
