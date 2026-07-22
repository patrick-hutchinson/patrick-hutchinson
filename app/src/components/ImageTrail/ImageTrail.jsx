import { motion, useAnimationFrame } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import Media from "../Media/Media";
import styles from "./ImageTrail.module.css";
import { getMouseDistance } from "./utils/utils";

const IMAGE_BASE_WIDTH = 180;
const IMAGE_RATIO = 1.59;
const MOVEMENT_THRESHOLD = 80;
const SCALE_RANGE = { min: 1.8, max: 2.2 };
const ROTATION_RANGE = { min: -10, max: 10 };
const TRAIL_ENTER_DURATION = 0.2;
const TRAIL_EXIT_DURATION = 0.3;
const TRAIL_EXIT_DURATION_MS = TRAIL_EXIT_DURATION * 1000;

function getRandomInRange(range) {
  return Math.random() * (range.max - range.min) + range.min;
}

function getSlotKey(medium, index) {
  const mediaKey = medium?._id || medium?.url || medium?.playbackId || "trail-media";
  return `${mediaKey}-${index}`;
}

function createSlots(mediaItems) {
  return mediaItems.map((medium, index) => ({
    activationId: 0,
    index,
    medium,
    phase: "hidden",
    randomRotation: 0,
    randomScale: 1,
    x: 0,
    y: 0,
    zIndex: 0,
  }));
}

const ImageTrail = ({ media }) => {
  const containerRef = useRef(null);
  const pointerClientPosition = useRef(null);
  const lastLocalPosition = useRef(null);
  const slotActivationIds = useRef([]);
  const slotCounter = useRef(0);
  const slotHideTimeouts = useRef(new Map());
  const slotReuseTimeouts = useRef(new Map());
  const slotsRef = useRef([]);
  const zCounter = useRef(0);
  const mediaItems = useMemo(() => (Array.isArray(media) ? media.filter(Boolean) : []), [media]);
  const [slots, setSlots] = useState(() => createSlots(mediaItems));

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    slotHideTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    slotHideTimeouts.current.clear();
    slotReuseTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    slotReuseTimeouts.current.clear();
    slotCounter.current = 0;
    zCounter.current = 0;
    slotActivationIds.current = mediaItems.map(() => 0);
    lastLocalPosition.current = null;
    const nextSlots = createSlots(mediaItems);
    slotsRef.current = nextSlots;
    setSlots(nextSlots);
  }, [mediaItems]);

  useEffect(
    () => () => {
      slotHideTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      slotHideTimeouts.current.clear();
      slotReuseTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      slotReuseTimeouts.current.clear();
    },
    [],
  );

  useEffect(() => {
    const updatePointerPosition = (event) => {
      pointerClientPosition.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const clearPointerPosition = () => {
      pointerClientPosition.current = null;
      lastLocalPosition.current = null;
    };

    window.addEventListener("pointermove", updatePointerPosition, { passive: true });
    window.addEventListener("pointerleave", clearPointerPosition);

    return () => {
      window.removeEventListener("pointermove", updatePointerPosition);
      window.removeEventListener("pointerleave", clearPointerPosition);
    };
  }, []);

  const updateSlots = (updater) => {
    setSlots((currentSlots) => {
      const nextSlots = updater(currentSlots);
      slotsRef.current = nextSlots;
      return nextSlots;
    });
  };

  const startSlotExit = (slotIndex, activationId) => {
    updateSlots((currentSlots) =>
      currentSlots.map((slot, index) =>
        index === slotIndex && slot.activationId === activationId && slot.phase !== "hidden"
          ? { ...slot, phase: "exiting" }
          : slot,
      ),
    );

    window.clearTimeout(slotHideTimeouts.current.get(slotIndex));
    const hideTimeoutId = window.setTimeout(() => {
      updateSlots((currentSlots) =>
        currentSlots.map((slot, index) =>
          index === slotIndex && slot.activationId === activationId && slot.phase === "exiting"
            ? { ...slot, phase: "hidden" }
            : slot,
        ),
      );
      slotHideTimeouts.current.delete(slotIndex);
    }, TRAIL_EXIT_DURATION_MS);

    slotHideTimeouts.current.set(slotIndex, hideTimeoutId);
  };

  const activateSlot = (slotIndex, x, y) => {
    const randomScale = getRandomInRange(SCALE_RANGE);
    const randomRotation = getRandomInRange(ROTATION_RANGE);
    const nextActivationId = (slotActivationIds.current[slotIndex] || 0) + 1;

    zCounter.current += 1;
    slotActivationIds.current[slotIndex] = nextActivationId;
    window.clearTimeout(slotHideTimeouts.current.get(slotIndex));
    window.clearTimeout(slotReuseTimeouts.current.get(slotIndex));
    slotHideTimeouts.current.delete(slotIndex);
    slotReuseTimeouts.current.delete(slotIndex);

    updateSlots((currentSlots) =>
      currentSlots.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              activationId: nextActivationId,
              phase: "visible",
              randomRotation,
              randomScale,
              x,
              y,
              zIndex: zCounter.current,
            }
          : slot,
      ),
    );
  };

  const showNextSlot = (x, y) => {
    if (!mediaItems.length) return;

    const activeSlotIndex = slotCounter.current;
    const activeSlot = slotsRef.current[activeSlotIndex];

    slotCounter.current = (slotCounter.current + 1) % mediaItems.length;

    if (!activeSlot || activeSlot.phase === "hidden") {
      activateSlot(activeSlotIndex, x, y);
      return;
    }

    startSlotExit(activeSlotIndex, activeSlot.activationId);

    window.clearTimeout(slotReuseTimeouts.current.get(activeSlotIndex));
    const reuseTimeoutId = window.setTimeout(() => {
      activateSlot(activeSlotIndex, x, y);
    }, TRAIL_EXIT_DURATION_MS);

    slotReuseTimeouts.current.set(activeSlotIndex, reuseTimeoutId);
  };

  useAnimationFrame(() => {
    const container = containerRef.current;
    const pointer = pointerClientPosition.current;

    if (!container || !pointer || !mediaItems.length) return;

    const rect = container.getBoundingClientRect();
    const isInside =
      pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;

    if (!isInside) {
      lastLocalPosition.current = null;
      return;
    }

    const localPosition = {
      x: pointer.x - rect.left,
      y: pointer.y - rect.top,
    };

    if (!lastLocalPosition.current) {
      lastLocalPosition.current = localPosition;
      return;
    }

    const distance = getMouseDistance(localPosition, lastLocalPosition.current);
    if (distance <= MOVEMENT_THRESHOLD) return;

    lastLocalPosition.current = localPosition;
    showNextSlot(localPosition.x, localPosition.y);
  });

  if (!mediaItems.length) return null;

  return (
    <div className={styles.container} ref={containerRef}>
      {slots.map((slot) => {
        const isVisible = slot.phase === "visible";
        const isHidden = slot.phase === "hidden";

        return (
          <motion.div
            animate={{
              opacity: isVisible ? 1 : 0,
              rotateZ: isVisible ? slot.randomRotation : -1,
              scale: isVisible ? slot.randomScale : 0,
            }}
            className={styles["content__img"]}
            initial={{ opacity: 0, rotateZ: -1, scale: 0 }}
            key={getSlotKey(slot.medium, slot.index)}
            style={{
              x: slot.x - (IMAGE_BASE_WIDTH * slot.randomScale) / 2,
              y: slot.y - ((IMAGE_BASE_WIDTH / IMAGE_RATIO) * slot.randomScale) / 2,
              zIndex: slot.zIndex,
            }}
            transition={{ duration: isVisible ? TRAIL_ENTER_DURATION : TRAIL_EXIT_DURATION, ease: "easeInOut" }}
          >
            <div className={styles["content__img-inner"]}>
              <Media medium={slot.medium} paused={isHidden} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ImageTrail;
