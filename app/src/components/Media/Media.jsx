"use client";

import ImageCompose from "./components/Image/ImageCompose";
import VideoCompose from "./components/Video/VideoCompose";

const Media = ({ className, medium, eager = false }) => {
  if (!medium || (!medium.url && !medium.playbackId)) return undefined;

  switch (medium.type) {
    case "image":
      return <ImageCompose medium={medium} className={className} eager={eager} />;
    case "video":
      return <VideoCompose medium={medium} className={className} />;
    default:
      return null;
  }
};

Media.displayName = "Media";
export default Media;
