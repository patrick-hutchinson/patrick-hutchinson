import styles from "./Marquee.module.css";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_SCROLL_SPEED = 60;
const OVERFLOW_TOLERANCE = 1;
const MIN_LOOP_SLIDE_COUNT = 3;

const Marquee = ({ canDrag = true, reliableLoop = true, string, typo }) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const [loopDistance, setLoopDistance] = useState(0);
  const [slideCount, setSlideCount] = useState(MIN_LOOP_SLIDE_COUNT);
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const viewportRef = useRef(null);
  const slides = shouldScroll && reliableLoop ? Array.from({ length: slideCount }, () => string) : [string];

  const measureLoop = useCallback(() => {
    if (!viewportRef.current || !containerRef.current || !measureRef.current) return;

    const viewportWidth = viewportRef.current.clientWidth;
    const slideWidth = measureRef.current.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(containerRef.current).columnGap) || 0;
    const distance = slideWidth + gap;
    const nextShouldScroll = slideWidth > viewportWidth + OVERFLOW_TOLERANCE;

    setLoopDistance(distance);
    setShouldScroll(nextShouldScroll);

    if (nextShouldScroll && reliableLoop && distance > 0) {
      setSlideCount(Math.max(MIN_LOOP_SLIDE_COUNT, Math.ceil(viewportWidth / distance) + 2));
    }
  }, [reliableLoop]);

  useEffect(() => {
    measureLoop();

    const measureNode = measureRef.current;
    const viewportNode = viewportRef.current;
    if (!viewportNode || !measureNode) return undefined;

    const resizeObserver = new ResizeObserver(measureLoop);
    resizeObserver.observe(viewportNode);
    resizeObserver.observe(measureNode);

    document.fonts?.ready.then(measureLoop);

    return () => resizeObserver.disconnect();
  }, [measureLoop, string]);

  return (
    <div typo={typo}>
      <div className={styles.viewport} ref={viewportRef}>
        <div
          className={[
            styles.container,
            shouldScroll ? styles.containerScrolling : null,
            canDrag ? null : styles.containerDragDisabled,
          ]
            .filter(Boolean)
            .join(" ")}
          ref={containerRef}
          style={{
            "--marquee-distance": `${loopDistance}px`,
            "--marquee-duration": `${Math.max(1, loopDistance / AUTO_SCROLL_SPEED)}s`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              aria-hidden={index > 0 ? "true" : undefined}
              className={styles.slide}
              key={`${slide}-${index}`}
              ref={index === 0 ? measureRef : null}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
