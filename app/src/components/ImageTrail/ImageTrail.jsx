import { motion, useAnimationFrame } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import Media from "../Media/Media";
import styles from "./ImageTrail.module.css";
import { getMouseDistance } from "./utils/utils";

const IMAGE_BASE_WIDTH = 180;
const IMAGE_RATIO = 1.59;
const MOVEMENT_THRESHOLD = 40;
const SCALE_RANGE = { min: 1.8, max: 2.2 };
const ROTATION_RANGE = { min: -10, max: 10 };
const TRAIL_ENTER_DURATION = 0.2;
const TRAIL_EXIT_DURATION = 0.3;
const TRAIL_EXIT_DURATION_MS = TRAIL_EXIT_DURATION * 1000;
const TRAIL_COPIES_PER_MEDIA = 2;
const TRAIL_POOL_COPIES_PER_MEDIA = TRAIL_COPIES_PER_MEDIA + 1;

function getRandomInRange(range) {
  return Math.random() * (range.max - range.min) + range.min;
}

function createTrailItems(mediaItems) {
  return mediaItems.flatMap((medium, mediaIndex) =>
    Array.from({ length: TRAIL_POOL_COPIES_PER_MEDIA }, (_, copyIndex) => ({
      activationId: 0,
      copyIndex,
      id: `${mediaIndex}-${copyIndex}`,
      mediaIndex,
      medium,
      phase: "hidden",
      randomRotation: 0,
      randomScale: 1,
      x: 0,
      y: 0,
      zIndex: 0,
    })),
  );
}

const ImageTrail = ({ isActive = true, media }) => {
  const containerRef = useRef(null);
  const pointerClientPosition = useRef(null);
  const lastLocalPosition = useRef(null);
  const activationCounter = useRef(0);
  const itemHideTimeouts = useRef(new Map());
  const mediaCounter = useRef(0);
  const trailItemsRef = useRef([]);
  const zCounter = useRef(0);
  const mediaItems = useMemo(() => (Array.isArray(media) ? media.filter(Boolean) : []), [media]);
  const [trailItems, setTrailItems] = useState(() => createTrailItems(mediaItems));

  useEffect(() => {
    trailItemsRef.current = trailItems;
  }, [trailItems]);

  useEffect(() => {
    itemHideTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    itemHideTimeouts.current.clear();
    activationCounter.current = 0;
    mediaCounter.current = 0;
    zCounter.current = 0;
    lastLocalPosition.current = null;
    const nextItems = createTrailItems(mediaItems);
    trailItemsRef.current = nextItems;
    setTrailItems(nextItems);
  }, [mediaItems]);

  useEffect(
    () => () => {
      itemHideTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      itemHideTimeouts.current.clear();
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

  const updateTrailItems = (updater) => {
    setTrailItems((currentItems) => {
      const nextItems = updater(currentItems);
      trailItemsRef.current = nextItems;
      return nextItems;
    });
  };

  const startItemExit = (itemId, activationId) => {
    updateTrailItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId && item.activationId === activationId && item.phase !== "hidden"
          ? { ...item, phase: "exiting" }
          : item,
      ),
    );

    window.clearTimeout(itemHideTimeouts.current.get(itemId));
    const hideTimeoutId = window.setTimeout(() => {
      updateTrailItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId && item.activationId === activationId && item.phase === "exiting"
            ? { ...item, phase: "hidden" }
            : item,
        ),
      );
      itemHideTimeouts.current.delete(itemId);
    }, TRAIL_EXIT_DURATION_MS);

    itemHideTimeouts.current.set(itemId, hideTimeoutId);
  };

  const getReusableItem = (mediaIndex) => {
    const mediaPool = trailItemsRef.current.filter((item) => item.mediaIndex === mediaIndex);
    const hiddenItem = mediaPool.find((item) => item.phase === "hidden");

    if (hiddenItem) return hiddenItem;

    return mediaPool.reduce(
      (oldestItem, item) => (item.zIndex < oldestItem.zIndex ? item : oldestItem),
      mediaPool[0],
    );
  };

  const addTrailItem = (mediaIndex, x, y) => {
    const reusableItem = getReusableItem(mediaIndex);
    if (!reusableItem) return;

    const randomScale = getRandomInRange(SCALE_RANGE);
    const randomRotation = getRandomInRange(ROTATION_RANGE);

    activationCounter.current += 1;
    zCounter.current += 1;
    window.clearTimeout(itemHideTimeouts.current.get(reusableItem.id));
    itemHideTimeouts.current.delete(reusableItem.id);

    const nextActivationId = activationCounter.current;
    const nextItems = trailItemsRef.current.map((item) =>
      item.id === reusableItem.id
        ? {
            ...item,
            activationId: nextActivationId,
            phase: "visible",
            randomRotation,
            randomScale,
            x,
            y,
            zIndex: zCounter.current,
          }
        : item,
    );

    trailItemsRef.current = nextItems;
    setTrailItems(nextItems);

    const visibleMediaItems = nextItems
      .filter((item) => item.mediaIndex === mediaIndex && item.phase === "visible")
      .sort((a, b) => a.zIndex - b.zIndex);
    const overflowingItems = visibleMediaItems.slice(0, Math.max(0, visibleMediaItems.length - TRAIL_COPIES_PER_MEDIA));

    overflowingItems.forEach((item) => startItemExit(item.id, item.activationId));
  };

  const showNextItem = (x, y) => {
    if (!mediaItems.length) return;

    const mediaIndex = mediaCounter.current;

    mediaCounter.current = (mediaCounter.current + 1) % mediaItems.length;
    addTrailItem(mediaIndex, x, y);
  };

  useEffect(() => {
    if (isActive) return;

    pointerClientPosition.current = null;
    lastLocalPosition.current = null;

    trailItemsRef.current.forEach((item) => {
      if (item.phase !== "hidden") startItemExit(item.id, item.activationId);
    });
  }, [isActive]);

  useAnimationFrame(() => {
    const container = containerRef.current;
    const pointer = pointerClientPosition.current;

    if (!isActive || !container || !pointer || !mediaItems.length) return;

    const rect = container.getBoundingClientRect();
    const isInside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;

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
    showNextItem(localPosition.x, localPosition.y);
  });

  if (!mediaItems.length) return null;

  return (
    <div className={styles.container} ref={containerRef}>
      {trailItems.map((item) => {
        const isVisible = item.phase === "visible";
        const isHidden = item.phase === "hidden";

        return (
          <motion.div
            animate={{
              opacity: isVisible ? 1 : 0,
              rotateZ: isVisible ? item.randomRotation : -1,
              scale: isVisible ? item.randomScale : 0,
            }}
            className={styles["content__img"]}
            initial={{ opacity: 0, rotateZ: -1, scale: 0 }}
            key={item.id}
            style={{
              x: item.x - (IMAGE_BASE_WIDTH * item.randomScale) / 2,
              y: item.y - ((IMAGE_BASE_WIDTH / IMAGE_RATIO) * item.randomScale) / 2,
              zIndex: item.zIndex,
            }}
            transition={{ duration: isVisible ? TRAIL_ENTER_DURATION : TRAIL_EXIT_DURATION, ease: "easeInOut" }}
          >
            <div className={styles["content__img-inner"]}>
              <Media medium={item.medium} paused={isHidden} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ImageTrail;
