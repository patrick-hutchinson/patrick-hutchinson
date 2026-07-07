"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

const ViewportContext = createContext(null);

export const ViewportProvider = ({ children }) => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return <ViewportContext.Provider value={{ viewportHeight, viewportWidth }}>{children}</ViewportContext.Provider>;
};

export const useViewport = () => {
  const ctx = useContext(ViewportContext);
  if (!ctx) throw new Error("useViewport must be used inside ViewportProvider");
  return ctx;
};
