import styles from "./FilterMenu.module.css";

import { useEffect, useRef, useState } from "react";

const FilterMenu = ({ activeFilter, array = [], className, onFilterChange }) => {
  const labelRef = useRef(null);
  const listRef = useRef(null);
  const [widths, setWidths] = useState({ closed: 0, open: 0 });

  useEffect(() => {
    const updateWidths = () => {
      const labelWidth = labelRef.current?.scrollWidth || 0;
      const listWidth = listRef.current?.scrollWidth || 0;

      setWidths({ closed: labelWidth, open: listWidth });
    };

    updateWidths();
    window.addEventListener("resize", updateWidths);
    document.fonts?.ready.then(updateWidths);

    return () => window.removeEventListener("resize", updateWidths);
  }, [array]);

  const handleClick = (entry) => {
    onFilterChange?.(activeFilter === entry ? null : entry);
  };

  return (
    <nav
      className={[className, styles.filterMenu].filter(Boolean).join(" ")}
      typo="fineprint"
      aria-label="Filter projects"
      style={{
        "--closed-width": `${widths.closed}px`,
        "--open-width": `${widths.open}px`,
      }}
    >
      <span className={styles.filterMenuLabel} ref={labelRef}>
        Filter
      </span>
      <ul className={styles.filterMenuList} ref={listRef}>
        {array.map((entry) => (
          <li
            className={`${styles.filterMenuItem} ${activeFilter && activeFilter !== entry ? styles.inactiveFilterItem : ""}`}
            key={entry}
          >
            <button type="button" aria-pressed={activeFilter === entry} onClick={() => handleClick(entry)}>
              {entry}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default FilterMenu;
