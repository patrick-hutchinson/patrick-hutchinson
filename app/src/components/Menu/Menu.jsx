import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./Menu.module.css";
const Menu = ({ className }) => {
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
  }, []);

  return (
    <nav
      data-menu-control
      className={[className, styles.menu].filter(Boolean).join(" ")}
      typo="fineprint"
      aria-label="Primary navigation"
      style={{
        "--closed-width": `${widths.closed}px`,
        "--open-width": `${widths.open}px`,
      }}
    >
      <span className={styles.menuLabel} ref={labelRef}>
        Menu
      </span>
      <ul className={styles.menuList} ref={listRef}>
        <li className={styles.menuItem}>
          <Link href="/" scroll={false}>
            Index
          </Link>
        </li>
        <li className={styles.menuItem} style={{ marginRight: "80px" }}>
          <Link href="/info" scroll={false}>
            Info
          </Link>
        </li>
        <li className={styles.menuItem}>
          <a href="mailto:hutchinsonpatrick@icloud.com">Contact</a>
        </li>
      </ul>
    </nav>
  );
};

export default Menu;
