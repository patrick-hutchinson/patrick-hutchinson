import { CYLINDER_MODES } from "@/components/CylinderView/cylinderModes";
import Menu from "@/components/Menu/Menu";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import styles from "./Header.module.scss";

const Header = ({ cylinderMode, language, setCylinderMode, showCylinderModeToggle = false, site }) => {
  return (
    <div className={styles.controls}>
      <motion.div className={styles.leftControls} layout transition={{ duration: 0.35, ease: "easeInOut" }}>
        <Link href="/" typo="fineprint" className={styles.homeButton}>
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
              typo="fineprint"
              aria-label="Cylinder view options"
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
                Titles
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
                Images
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.div layout transition={{ duration: 0.35, ease: "easeInOut" }}>
          <Menu language={language} socials={site.socials} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Header;
