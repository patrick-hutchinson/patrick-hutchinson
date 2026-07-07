import styles from "./Marquee.module.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

const AUTO_SCROLL_SPEED = 1;
const OVERFLOW_TOLERANCE = 1;
const SCROLLING_SLIDE_COUNT = 3;

const Marquee = ({ string, typo }) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const [viewportNode, setViewportNode] = useState(null);
  const measureRef = useRef(null);
  const animationFrame = useRef(null);
  const options = useMemo(
    () => ({
      align: "start",
      containScroll: false,
      dragFree: shouldScroll,
      loop: shouldScroll,
      skipSnaps: true,
      watchDrag: shouldScroll,
    }),
    [shouldScroll],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const slides = shouldScroll ? Array.from({ length: SCROLLING_SLIDE_COUNT }, () => string) : [string];

  const setRefs = useCallback(
    (node) => {
      emblaRef(node);
      setViewportNode(node);
    },
    [emblaRef],
  );

  const measureOverflow = useCallback(() => {
    if (!viewportNode || !measureRef.current) return;

    const nextShouldScroll = measureRef.current.scrollWidth > viewportNode.clientWidth + OVERFLOW_TOLERANCE;
    setShouldScroll(nextShouldScroll);
  }, [viewportNode]);

  useEffect(() => {
    measureOverflow();

    const measureNode = measureRef.current;
    if (!viewportNode || !measureNode) return undefined;

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(viewportNode);
    resizeObserver.observe(measureNode);

    document.fonts?.ready.then(measureOverflow);

    return () => resizeObserver.disconnect();
  }, [measureOverflow, string, viewportNode]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.reInit(options);
  }, [emblaApi, options, slides.length]);

  useEffect(() => {
    if (!emblaApi || !shouldScroll) return undefined;

    const engine = emblaApi.internalEngine();

    const scroll = () => {
      if (!engine.dragHandler.pointerDown()) {
        engine.location.add(-AUTO_SCROLL_SPEED);
        engine.target.set(engine.location);
        engine.scrollLooper.loop(-1);
        engine.slideLooper.loop();
        engine.translate.to(engine.location.get());
      }

      animationFrame.current = requestAnimationFrame(scroll);
    };

    animationFrame.current = requestAnimationFrame(scroll);

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [emblaApi, shouldScroll]);

  return (
    <div typo={typo}>
      <div className={styles.viewport} ref={setRefs}>
        <div className={styles.container}>
          {slides.map((slide, index) => (
            <div className={styles.slide} key={`${slide}-${index}`} ref={index === 0 ? measureRef : null}>
              {slide}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
