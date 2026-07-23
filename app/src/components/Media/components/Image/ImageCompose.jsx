import { useState } from "react";

import Image from "./Image";
import styles from "../../Media.module.css";
import Placeholder from "../Placeholder";
import { isGifMedium } from "@/lib/media/projectThumbnails";

const ImageCompose = ({ medium, className, eager = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const isGif = isGifMedium(medium);

  return (
    <div className={`${styles.mediaContainer} ${className}`}>
      {!isGif ? <Placeholder medium={medium} isLoaded={isLoaded} /> : null}
      <Image medium={medium} setIsLoaded={setIsLoaded} eager={eager} />
    </div>
  );
};

export default ImageCompose;
