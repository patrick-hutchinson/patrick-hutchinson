import Media from "@/components/Media/Media";
import styles from "./ScaleGallery.module.css";

const ScaleGallery = ({ block, fallbackSubcaption }) => {
  const media = block?.media || [];

  return (
    <div className={styles.scaleGallery}>
      {media.map((entry, index) => {
        return (
          <div className={styles.container} key={entry?._key || entry?.medium?._id || index}>
            <Media className={styles.media} medium={entry.medium} />
            <div typo="fineprint" className={styles.caption}>
              {entry?.medium?.caption || "Here's a placeholder caption for the media piece"}
            </div>

            <div typo="h5" className={styles.subcaption}>
              {entry?.medium?.subcaption || fallbackSubcaption || "Here's a placeholder caption for the media piece"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScaleGallery;
