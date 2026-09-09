import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { getLocalizedPath } from "@/lib/i18n";
import styles from "./Menu.module.css";
const Menu = ({ className, language = "en", socials = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalElement, setPortalElement] = useState(null);
  const socialItems = Array.isArray(socials) ? socials : [];

  useEffect(() => {
    setPortalElement(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
    };

    document.documentElement.dataset.menuOverlayOpen = "true";
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.menuOverlayOpen;
    };
  }, []);

  const overlay = (
      <AnimatePresence
        onExitComplete={() => {
          delete document.documentElement.dataset.menuOverlayOpen;
        }}
      >
        {isOpen ? (
          <motion.nav
            animate={{ opacity: 1 }}
            aria-label="Primary navigation"
            className={styles.menuOverlay}
            exit={{ opacity: 0 }}
            id="primary-menu-overlay"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <button
              aria-label="Close menu"
              className={styles.overlayHitArea}
              onClick={() => setIsOpen(false)}
              type="button"
            />
            <ul className={styles.menuList} typo="h2">
              <li className={styles.menuItem}>
                <Link href={getLocalizedPath("/", language)} onClick={() => setIsOpen(false)} scroll={false}>
                  Index
                </Link>
              </li>
              <li className={styles.menuItem}>
                <Link href={getLocalizedPath("/info", language)} onClick={() => setIsOpen(false)} scroll={false}>
                  Info
                </Link>
              </li>
              <li className={styles.menuItem}>
                <a href="mailto:hutchinsonpatrick@icloud.com" onClick={() => setIsOpen(false)}>
                  Contact
                </a>
              </li>
            </ul>
            {socialItems.length ? (
              <ul className={styles.socialList} typo="fineprint">
                {socialItems.map((social) => (
                  <li className={styles.socialItem} key={social.platform}>
                    <a href={social.link} onClick={() => setIsOpen(false)} target="_blank">
                      {social.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.nav>
        ) : null}
      </AnimatePresence>
  );

  return (
    <>
      <button
        aria-controls="primary-menu-overlay"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className={[className, styles.menuButton, isOpen ? styles.menuButtonOpen : null].filter(Boolean).join(" ")}
        data-menu-control
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
        type="button"
      >
        <span aria-hidden="true" className={styles.menuLabel}>
          <span className={styles.burgerIcon}>
            <span />
            <span />
            <span />
          </span>
        </span>
      </button>
      {portalElement ? createPortal(overlay, portalElement) : null}
    </>
  );
};

export default Menu;
