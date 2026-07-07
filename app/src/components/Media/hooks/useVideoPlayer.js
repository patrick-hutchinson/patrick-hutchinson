import { useRef, useState } from "react";

export function useVideoPlayer() {
  const playerRef = useRef(null);
  const lastSecondRef = useRef(0);

  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function onTimeUpdate(e) {
    const seconds = Math.floor(e.target.currentTime);
    if (seconds === lastSecondRef.current) return;
    lastSecondRef.current = seconds;
    setProgress(formatTime(seconds));
  }

  function onLoadedMetadata(e) {
    if (!setDuration) return;

    setDuration(formatTime(Math.floor(e.target.duration)));
  }

  const enterFullscreen = () => {
    console.log("entering fullscreen!");
    const player = playerRef.current;
    if (!player) return;

    console.log("player exists!");

    // ---- Standard Fullscreen API (desktop + Android + iOS16+ sometimes)
    if (player.requestFullscreen) {
      player.requestFullscreen();
      return;
    }

    // ---- Safari iOS: must target the <video> element
    const video =
      player.shadowRoot?.querySelector("video") ||
      player.shadowRoot?.querySelector("mux-video") ||
      player.querySelector("video") ||
      player.media ||
      player.video;

    if (video?.webkitEnterFullscreen) {
      video.pause();
      setPaused(true);

      video.playsInline = false;

      // Re-enable inline playback after Safari exits fullscreen
      video.addEventListener(
        "webkitendfullscreen",
        () => {
          // Restore inline mode
          video.playsInline = true;

          // Make sure it's muted so iOS allows inline autoplay
          video.muted = true;

          // Try resuming playback
          const playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(() => {
              console.warn("iOS blocked autoplay after fullscreen exit");
            });
          }

          // Update your React state
          setPaused(false);
        },
        { once: true },
      );

      video.webkitEnterFullscreen();
      return;
    }

    console.warn("Fullscreen not supported on this device/browser");
  };

  return {
    playerRef,
    muted,
    setMuted,
    paused,
    setPaused,
    progress,
    duration,
    onTimeUpdate,
    onLoadedMetadata,
    enterFullscreen,
  };
}
