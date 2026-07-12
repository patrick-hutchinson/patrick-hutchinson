import { useEffect, useRef, useState } from "react";

import styles from "./Credits.module.css";

const getEntryKey = (credit, creditIndex, entryIndex) => `${credit._id || creditIndex}-${entryIndex}`;

const Credits = ({ credits }) => {
  const entryRefs = useRef({});
  const [activeEntries, setActiveEntries] = useState(() => new Set());

  useEffect(() => {
    setActiveEntries(new Set());

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const entryKey = entry.target.dataset.creditEntryKey;

          setActiveEntries((current) => {
            const next = new Set(current);

            if (entry.isIntersecting) {
              next.add(entryKey);
            } else {
              next.delete(entryKey);
            }

            return next;
          });
        });
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.1 },
    );

    Object.entries(entryRefs.current).forEach(([entryKey, node]) => {
      if (!node) return;

      node.dataset.creditEntryKey = entryKey;
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, [credits]);

  return (
    <div className={styles.credits}>
      {credits.map((credit, creditIndex) => (
        <div key={credit._id} className={styles.credit}>
          <div className={styles.creditTitle} typo="h5">
            {credit.role}
          </div>
          <div className={styles.entries}>
            {credit.entries?.map((entry, index) => (
              <div
                className={activeEntries.has(getEntryKey(credit, creditIndex, index)) ? styles.entryActive : styles.entry}
                key={index}
                ref={(node) => {
                  entryRefs.current[getEntryKey(credit, creditIndex, index)] = node;
                }}
                typo="longcopy"
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Credits;
