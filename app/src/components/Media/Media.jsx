"use client";

import ImageCompose from "./components/Image/ImageCompose";
import VideoCompose from "./components/Video/VideoCompose";

const Media = ({ className, medium, eager = false, paused, showPlaceholder = true }) => {
  if (!medium || (!medium.url && !medium.playbackId)) return undefined;

  switch (medium.type) {
    case "image":
      return <ImageCompose medium={medium} className={className} eager={eager} />;
    case "video":
      return (
        <VideoCompose
          medium={medium}
          className={className}
          eager={eager}
          paused={paused}
          showPlaceholder={showPlaceholder}
        />
      );
    default:
      return null;
  }
};

Media.displayName = "Media";
export default Media;
