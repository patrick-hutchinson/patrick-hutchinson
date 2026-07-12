import Media from "@/components/Media/Media";
import styles from "./ScaleGallery.module.css";

const ScaleGalleryItem = ({ entry, fallbackSubcaption, index, isMobile }) => {
  const className = [styles.container, isMobile ? styles.mobileContainer : null].filter(Boolean).join(" ");

  return (
    <div className={className} key={entry?._key || entry?.medium?._id || index}>
      <Media className={styles.media} medium={entry.medium} />
      <div typo="fineprint" className={styles.caption}>
        {entry?.medium?.caption || "Here's a placeholder caption for the media piece"}
      </div>

      <div typo="h5" className={styles.subcaption}>
        {entry?.medium?.subcaption || fallbackSubcaption || "Here's a placeholder caption for the media piece"}
      </div>
    </div>
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
