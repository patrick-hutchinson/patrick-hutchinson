// context/LenisContext.js
"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";

const LenisContext = createContext(null);

export const useLenisContext = () => useContext(LenisContext);

function LenisContextProvider({ children }) {
  const lenis = useLenis();
  const router = useRouter();
  const resetTimers = useRef([]);

  const clearResetTimers = useCallback(() => {
    resetTimers.current.forEach(({ id, type }) => {
      if (type === "frame") {
        cancelAnimationFrame(id);
        return;
      }

      clearTimeout(id);
    });
    resetTimers.current = [];
  }, []);

  const scrollToTop = useCallback(() => {
    lenis?.scrollTo?.(0, { force: true, immediate: true });
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [lenis]);

  const queueScrollToTop = useCallback(() => {
    clearResetTimers();
    lenis?.stop?.();
    scrollToTop();

    const queueFrame = (callback) => {
      const id = requestAnimationFrame(callback);
      resetTimers.current.push({ id, type: "frame" });
    };

    const queueTimeout = (callback, delay) => {
      const id = setTimeout(callback, delay);
      resetTimers.current.push({ id, type: "timeout" });
    };

    queueFrame(() => {
      scrollToTop();
      queueFrame(scrollToTop);
    });
    queueTimeout(scrollToTop, 80);
    queueTimeout(scrollToTop, 180);
    queueTimeout(() => {
      scrollToTop();
      lenis?.start?.();
    }, 320);
  }, [clearResetTimers, lenis, scrollToTop]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      lenis?.stop?.();
    };

    const handleRouteChangeComplete = () => {
      queueScrollToTop();
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    return () => {
      clearResetTimers();
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [clearResetTimers, lenis, queueScrollToTop, router.events]);

  useEffect(() => {
    queueScrollToTop();
  }, [queueScrollToTop, router.asPath]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export default function LenisProvider({ children }) {
  const { pathname } = useRouter();

  const infiniteRoutes = ["/"];
  const scrollInfinite = infiniteRoutes.includes(pathname);

  return (
    <ReactLenis root options={{ infinite: scrollInfinite, stopInertiaOnNavigate: true, syncTouch: true }}>
      <LenisContextProvider>{children}</LenisContextProvider>
    </ReactLenis>
  );
}
