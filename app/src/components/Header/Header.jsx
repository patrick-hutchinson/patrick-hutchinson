import { CYLINDER_MODES } from "@/components/CylinderView/cylinderModes";
import Menu from "@/components/Menu/Menu";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import styles from "./Header.module.scss";

const THEME_TRANSITION_DURATION = 450;

const Header = ({ cylinderMode, language, setCylinderMode, showCylinderModeToggle = false, site }) => {
  const { setTheme, theme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  const activeTheme = hasMounted && theme === "dark" ? "dark" : "light";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleThemeChange = (nextTheme) => {
    if (nextTheme === activeTheme) return;

    document.documentElement.dataset.themeSwitching = "true";
    window.setTimeout(() => {
      delete document.documentElement.dataset.themeSwitching;
    }, THEME_TRANSITION_DURATION);
    setTheme(nextTheme);
  };

  return (
    <div className={styles.header} typo="caption">
      <motion.div className={styles.leftControls} layout transition={{ duration: 0.35, ease: "easeInOut" }}>
        <Link href="/" className={styles.homeButton}>
          Patrick Hutchinson
        </Link>
      </motion.div>

      <motion.div className={styles.rightControls} layout transition={{ duration: 0.35, ease: "easeInOut" }}>
        <AnimatePresence initial={false} mode="popLayout">
          {showCylinderModeToggle ? (
            <motion.div
              animate={{ opacity: 1 }}
              className={styles.cylinderModeToggle}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="cylinder-mode-toggle"
              layout
              transition={{ duration: 0.35, ease: "easeInOut" }}
              aria-label="Cylinder view options"
              data-focus-static="true"
            >
              <button
                className={
                  cylinderMode === CYLINDER_MODES.TITLES
                    ? styles.cylinderModeToggleButtonActive
                    : styles.cylinderModeToggleButton
                }
                onClick={() => setCylinderMode(CYLINDER_MODES.TITLES)}
                type="button"
              >
                {cylinderMode === CYLINDER_MODES.TITLES ? (
                  <motion.span
                    className={styles.cylinderModeToggleHighlight}
                    layoutId="cylinder-mode-toggle-highlight"
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  />
                ) : null}
                <span className={styles.cylinderModeToggleLabel}>Titles</span>
              </button>
              <button
                className={
                  cylinderMode === CYLINDER_MODES.IMAGES
                    ? styles.cylinderModeToggleButtonActive
                    : styles.cylinderModeToggleButton
                }
                onClick={() => setCylinderMode(CYLINDER_MODES.IMAGES)}
                type="button"
              >
                {cylinderMode === CYLINDER_MODES.IMAGES ? (
                  <motion.span
                    className={styles.cylinderModeToggleHighlight}
                    layoutId="cylinder-mode-toggle-highlight"
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  />
                ) : null}
                <span className={styles.cylinderModeToggleLabel}>Images</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.div
          aria-label="Theme options"
          className={styles.cylinderModeToggle}
          data-focus-static="true"
          layout
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          <button
            className={activeTheme === "light" ? styles.cylinderModeToggleButtonActive : styles.cylinderModeToggleButton}
            onClick={() => handleThemeChange("light")}
            type="button"
          >
            {activeTheme === "light" ? (
              <motion.span
                className={styles.cylinderModeToggleHighlight}
                layoutId="theme-toggle-highlight"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            ) : null}
            <span className={styles.cylinderModeToggleLabel}>Light</span>
          </button>
          <button
            className={activeTheme === "dark" ? styles.cylinderModeToggleButtonActive : styles.cylinderModeToggleButton}
            onClick={() => handleThemeChange("dark")}
            type="button"
          >
            {activeTheme === "dark" ? (
              <motion.span
                className={styles.cylinderModeToggleHighlight}
                layoutId="theme-toggle-highlight"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              />
            ) : null}
            <span className={styles.cylinderModeToggleLabel}>Dark</span>
          </button>
        </motion.div>
        <motion.div layout transition={{ duration: 0.35, ease: "easeInOut" }}>
          <Menu language={language} socials={site.socials} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Header;
