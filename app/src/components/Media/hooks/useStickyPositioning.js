import { useState, useRef, useEffect, useContext } from "react";
import { DeviceContext } from "@/context/DeviceContext";

export function useStickyPositioning() {
  const { isDesktop } = useContext(DeviceContext);
  const containerRef = useRef(null);
  const [top, setTop] = useState(undefined);

  useEffect(() => {
    if (!containerRef.current) return;

    const height = containerRef.current.getBoundingClientRect().height;
    // setTop(isDesktop ? `calc(50% - ${height / 2}px)` : undefined);
    setTop("calc(var(--margin-page) + var(--header-height))");
  }, [isDesktop]);

  return { containerRef, top };
}
