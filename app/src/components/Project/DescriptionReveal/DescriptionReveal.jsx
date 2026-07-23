import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./DescriptionReveal.module.css";

const LINE_OFFSET_TOLERANCE = 2;

const DescriptionReveal = ({ className, text }) => {
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const [lineIndexes, setLineIndexes] = useState([]);
  const [activeLines, setActiveLines] = useState(() => new Set());
  const paragraphs = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => paragraph.split(/(\s+)/).filter(Boolean)),
    [text],
  );

  const measureLines = useCallback(() => {
    const lineTops = [];
    const nextLineIndexes = [];

    wordRefs.current.forEach((node, index) => {
      if (!node) return;

      const top = node.offsetTop;
      let lineIndex = lineTops.findIndex((lineTop) => Math.abs(lineTop - top) <= LINE_OFFSET_TOLERANCE);

      if (lineIndex === -1) {
        lineIndex = lineTops.length;
        lineTops.push(top);
      }

      nextLineIndexes[index] = lineIndex;
    });

    setLineIndexes(nextLineIndexes);
    setActiveLines(new Set());
  }, []);

  useEffect(() => {
    measureLines();

    const container = containerRef.current;
    if (!container) return undefined;

    const resizeObserver = new ResizeObserver(measureLines);
    resizeObserver.observe(container);
    document.fonts?.ready.then(measureLines);
    window.addEventListener("resize", measureLines);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureLines);
    };
  }, [measureLines, text]);

  useEffect(() => {
    const lineNodes = [];

    lineIndexes.forEach((lineIndex, wordIndex) => {
      if (lineNodes[lineIndex]) return;
      lineNodes[lineIndex] = wordRefs.current[wordIndex];
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const lineIndex = Number(entry.target.dataset.lineIndex);
          setActiveLines((current) => {
            const next = new Set(current);

            if (entry.isIntersecting) {
              next.add(lineIndex);
            } else {
              next.delete(lineIndex);
            }

            return next;
          });
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.1 },
    );

    lineNodes.forEach((node, lineIndex) => {
      if (!node) return;

      node.dataset.lineIndex = lineIndex;
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, [lineIndexes]);

  let wordIndex = 0;

  return (
    <div className={`${className} ${styles.description}`} ref={containerRef} typo="longcopy">
      {paragraphs.map((words, paragraphIndex) => (
        <p className={styles.paragraph} key={paragraphIndex}>
          {words.map((word) => {
            const index = wordIndex;
            wordIndex += 1;

            if (/^\s+$/.test(word)) return word;

            const lineIndex = lineIndexes[index];
            const isActive = typeof lineIndex === "number" && activeLines.has(lineIndex);

            return (
              <span
                className={isActive ? styles.wordActive : styles.word}
                key={`${word}-${index}`}
                ref={(node) => {
                  wordRefs.current[index] = node;
                }}
              >
                {word}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
};

export default DescriptionReveal;
