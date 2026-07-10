import Media from "@/components/Media/Media";
import styles from "./FullscreenMedium.module.css";

const FullscreenMedium = ({ block }) => {
  if (!block?.medium?.medium) return null;

  return (
    <div className={styles.container}>
      <figure className={styles.figure}>
        <Media className={styles.medium} medium={block.medium.medium} />
        <div typo="fineprint" className={styles.caption}>
          Here's a placeholder caption for the media piece.
        </div>

        <div typo="h5" className={styles.subcaption}>
          Here's a placeholder caption for the media piece.
        </div>
      </figure>
    </div>
  );
};

export default FullscreenMedium;
