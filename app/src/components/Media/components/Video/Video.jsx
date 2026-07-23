import { useEffect } from "react";

import { getVideoRenditionUrl } from "@/lib/media/projectThumbnails";

const Video = ({ medium, playerState, playerControls }) => {
  const src = getVideoRenditionUrl(medium);

  useEffect(() => {
    const player = playerControls.playerRef.current;
    if (!player) return;

    player.muted = playerControls.muted ?? true;

    if (playerControls.paused) {
      player.pause();
      return;
    }

    const playPromise = player.play();
    if (playPromise?.catch) playPromise.catch(() => {});
  }, [playerControls.muted, playerControls.paused, playerControls.playerRef]);

  if (!playerState.isInView || !src) return null;

  return (
    <video
      ref={playerControls.playerRef}
      src={src}
      autoPlay
      playsInline
      loop
      muted={playerControls.muted ?? true}
      preload={playerState.eager ? "auto" : "metadata"}
      poster={`https://image.mux.com/${medium.playbackId}/thumbnail.jpg?width=1200`}
      style={{
        position: "relative",
        opacity: 1,
        zIndex: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
      onCanPlay={() => playerState.setIsLoaded(true)}
      onTimeUpdate={playerControls.onTimeUpdate}
      onLoadedMetadata={playerControls.onLoadedMetadata}
    />
  );
};

export default Video;
