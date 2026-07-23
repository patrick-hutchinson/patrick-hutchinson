import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./Menu.module.css";
const Menu = ({ className }) => {
  const menuRef = useRef(null);
  const labelRef = useRef(null);
  const listRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const isHoveredRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [widths, setWidths] = useState({ closed: 0, open: 0 });

  const clearHideTimeout = () => {
    if (!hideTimeoutRef.current) return;

    window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = null;
  };

  const scheduleHide = () => {
    clearHideTimeout();

    hideTimeoutRef.current = window.setTimeout(() => {
      if (isHoveredRef.current) return;

      setIsOpen(false);
      hideTimeoutRef.current = null;
    }, 3000);
  };

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

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;

      clearHideTimeout();
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => clearHideTimeout();
  }, []);

  return (
    <nav
      ref={menuRef}
      data-menu-control
      className={[className, styles.menu, isOpen ? styles.menuOpen : null].filter(Boolean).join(" ")}
      typo="fineprint"
      aria-label="Primary navigation"
      aria-expanded={isOpen}
      onPointerEnter={() => {
        isHoveredRef.current = true;
        clearHideTimeout();
      }}
      onPointerLeave={() => {
        isHoveredRef.current = false;
        if (isOpen) scheduleHide();
      }}
      onClick={() => {
        clearHideTimeout();
        setIsOpen(true);
      }}
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
