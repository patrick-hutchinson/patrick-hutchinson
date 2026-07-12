import { useEffect, useMemo, useState } from "react";

import Media from "./Media";

function getMediaItems({ gallery, medium }) {
  const galleryItems = Array.isArray(gallery) ? gallery.map((item) => item?.medium).filter(Boolean) : [];

  if (galleryItems.length) return galleryItems;
  return medium ? [medium] : [];
}

const CyclingMedia = ({ className, gallery, interval = 500, medium }) => {
  const mediaItems = useMemo(() => getMediaItems({ gallery, medium }), [gallery, medium]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [mediaItems]);

  useEffect(() => {
    if (mediaItems.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % mediaItems.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, mediaItems.length]);

  const activeMedium = mediaItems[activeIndex];

  if (!activeMedium) return null;

  return <Media className={className} medium={activeMedium} eager />;
};

export default CyclingMedia;
