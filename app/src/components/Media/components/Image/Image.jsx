import NextImage from "next/image";

import { isGifMedium } from "@/lib/media/projectThumbnails";

const Image = ({ medium, setIsLoaded, eager = false }) => {
  const imageSource = medium.url;

  const resolutionWidth = medium.width;
  const resolutionHeight = medium.height;
  const isGif = isGifMedium(medium);

  const imageStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
    left: 0,
    top: 0,
    objectFit: "cover",
    objectPosition: "center",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: resolutionWidth / resolutionHeight,
        position: "relative",
      }}
    >
      {isGif ? (
        <img
          src={imageSource}
          alt="image"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          style={imageStyle}
          onLoad={() => setIsLoaded?.(true)}
        />
      ) : (
        <NextImage
          src={imageSource}
          alt="image"
          unoptimized
          width={resolutionWidth}
          height={resolutionHeight}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="sync"
          draggable={false}
          style={imageStyle}
          onLoad={() => setIsLoaded?.(true)}
        />
      )}
    </div>
  );
};

export default Image;
