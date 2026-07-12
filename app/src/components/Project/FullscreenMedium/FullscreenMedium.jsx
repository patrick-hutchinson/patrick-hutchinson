import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import Media from "@/components/Media/Media";
import styles from "./FullscreenMedium.module.css";

const FullscreenMedium = ({ block, fallbackSubcaption }) => {
  const figureRef = useRef(null);
  const isInView = useInView(figureRef, { amount: 0.45 });

  if (!block?.medium?.medium) return null;

  const medium = block.medium.medium;
  const caption = block?.caption || medium?.caption;
  const subcaption = block?.subcaption || medium?.subcaption || fallbackSubcaption;
  const copyright = block?.copyright || medium?.copyright;

  return (
    <div className={styles.container}>
      <motion.figure
        animate={{ "--media-scale": isInView ? 1.15 : 1 }}
        className={styles.figure}
        ref={figureRef}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className={styles.mediaFrame}>
          <Media className={styles.medium} medium={medium} />
        </div>
        <div typo="fineprint" className={styles.caption}>
          {caption || "Here's a placeholder caption for the media piece."}
        </div>

        <div typo="h5" className={styles.subcaption}>
          {subcaption || "Here's a placeholder caption for the media piece."}
        </div>

        {copyright ? (
          <div typo="fineprint" className={styles.copyright}>
            {copyright}
          </div>
        ) : null}
      </motion.figure>
    </div>
  );
};

export default FullscreenMedium;
