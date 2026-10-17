import Media from "@/components/Media/Media";
import { motion } from "framer-motion";
import styles from "./ScaleGallery.module.css";

const ScaleGalleryItem = ({ entry, fallbackSubcaption, index, isMobile }) => {
  const className = [styles.container, isMobile ? styles.mobileContainer : null].filter(Boolean).join(" ");

  return (
    <motion.div
      className={className}
      key={entry?._key || entry?.medium?._id || index}
      initial={isMobile ? { scale: 0.8 } : false}
      whileInView={isMobile ? { scale: 1 } : undefined}
      animate={isMobile ? { scale: 0.8 } : undefined}
      viewport={{ once: false, amount: 0.45 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Media className={styles.media} medium={entry.medium} />
      <div typo="caption" className={styles.caption}>
        {entry?.medium?.caption || "Here's a placeholder caption for the media piece"}
      </div>

      <div typo="fineprint" className={styles.subcaption}>
        {entry?.medium?.subcaption || fallbackSubcaption || "Here's a placeholder caption for the media piece"}
      </div>
    </motion.div>
  );
};

const ScaleGallery = ({ block, fallbackSubcaption, isMobile = false }) => {
  const media = block?.media || [];
  const className = [styles.scaleGallery, isMobile ? styles.mobileScaleGallery : null].filter(Boolean).join(" ");

  return (
    <div className={className}>
      {media.map((entry, index) => (
        <ScaleGalleryItem
          entry={entry}
          fallbackSubcaption={fallbackSubcaption}
          index={index}
          isMobile={isMobile}
          key={entry?._key || entry?.medium?._id || index}
        />
      ))}
    </div>
  );
};

export default ScaleGallery;
