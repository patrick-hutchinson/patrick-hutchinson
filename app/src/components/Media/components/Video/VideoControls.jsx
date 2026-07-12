"use client";

import { useContext } from "react";
import { DeviceContext } from "@/context/DeviceContext";

import styles from "../../Media.module.css";

const VideoControls = ({ className, playerState, playerControls }) => {
  const { isMobile } = useContext(DeviceContext);

  return (
    <div className={`${className}`} typo="fineprint">
      {!isMobile && (
        <>
          <div className={styles.duration}>
            {playerControls.progress == 0 ? "0:00" : playerControls.progress}/{playerControls.duration}
          </div>
          <button
            className={styles.playButton}
            onClick={(e) => {
              e.stopPropagation(); // 👈 prevent parent clicks
              e.preventDefault(); // ← This stops Next.js Link from navigating
              playerControls.setPaused((prevPaused) => !prevPaused);
            }}
          >
            {playerControls.paused ? "Play" : "Pause"}
          </button>
          <button
            className={styles.muteButton}
            onClick={(e) => {
              e.stopPropagation(); // 👈 prevent parent clicks
              e.preventDefault(); // ← This stops Next.js Link from navigating
              playerControls.setMuted((prevMuted) => !prevMuted);
            }}
          >
            {playerControls.muted ? "Unmute" : "Mute"}
          </button>
        </>
      )}

      {isMobile && (
        <button
          className={styles.fullscreenButton}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            playerControls.enterFullscreen(); // call the passed-in function manually
          }}
        >
          Fullscreen
        </button>
      )}
    </div>
  );
};

export default VideoControls;
