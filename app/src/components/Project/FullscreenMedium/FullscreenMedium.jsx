import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import Media from "@/components/Media/Media";
import styles from "./FullscreenMedium.module.css";

const FullscreenMedium = ({ block, fallbackSubcaption, isMobile = false }) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.45 });

  if (!block?.medium?.medium) return null;

  const medium = block.medium.medium;
  const caption = block?.caption || medium?.caption;
  const subcaption = block?.subcaption || medium?.subcaption || fallbackSubcaption;
  const copyright = block?.copyright || medium?.copyright;
  const figureClassName = [styles.figure, isMobile ? styles.mobileFigure : null].filter(Boolean).join(" ");

  return (
    <div className={styles.container} ref={containerRef}>
      <motion.figure
        initial={isMobile ? { scale: 0.8 } : false}
        whileInView={isMobile ? { scale: 1 } : undefined}
        viewport={{ once: false, amount: 0.4 }}
        animate={isMobile ? { scale: 0.8, "--media-scale": 1 } : { "--media-scale": isInView ? 0.9 : 0.8 }}
        className={figureClassName}
        transition={isMobile ? { duration: 0.5, ease: [0.22, 1, 0.36, 1] } : { duration: 0.3, ease: "easeInOut" }}
      >
        <div className={styles.mediaFrame}>
          <Media className={styles.medium} medium={medium} />
        </div>
        <div typo="caption" className={styles.caption}>
          {caption || "Here's a placeholder caption for the media piece."}
        </div>

        <div typo="fineprint" className={styles.subcaptionWrapper}>
          <div className={styles.subcaptionInner}>
            {subcaption ? (
              <div className={styles.subcaption}>{subcaption}</div>
            ) : (
              "Here's a placeholder caption for the media piece."
            )}
            {copyright ? <div className={styles.copyright}>© {copyright}</div> : null}
          </div>
        </div>
      </motion.figure>
    </div>
  );
};

export default FullscreenMedium;
