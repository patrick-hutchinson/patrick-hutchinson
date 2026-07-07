import NextImage from "next/image";

const Image = ({ medium, setIsLoaded, eager = false }) => {
  const imageSource = medium.url;

  const resolutionWidth = medium.width;
  const resolutionHeight = medium.height;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: resolutionWidth / resolutionHeight,
        position: "relative",
      }}
    >
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
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          left: 0,
          top: 0,
          objectFit: "cover",
          objectPosition: "center",
        }}
        onLoad={() => setIsLoaded?.(true)}
      />
    </div>
  );
};

export default Image;
