// context/LenisContext.js
"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { createContext, useContext } from "react";
import { useRouter } from "next/router";

const LenisContext = createContext(null);

export const useLenisContext = () => useContext(LenisContext);

function LenisContextProvider({ children }) {
  const lenis = useLenis();

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

export default function LenisProvider({ children }) {
  const { pathname } = useRouter();

  const infiniteRoutes = ["/"];
  const scrollInfinite = infiniteRoutes.includes(pathname);

  return (
    <ReactLenis root options={{ infinite: scrollInfinite, syncTouch: true }}>
      <LenisContextProvider>{children}</LenisContextProvider>
    </ReactLenis>
  );
}
