import { useContext, useState } from "react";

import { DeviceContext } from "@/context/DeviceContext";

export const useImageResolution = (medium, dimensions) => {
  const { isMobile } = useContext(DeviceContext);
  // 1. Custom dimensions always take priority
  const hasCustomDimensions = Boolean(dimensions);

  if (hasCustomDimensions) {
    return `${medium.url}?w=${dimensions.width}&h=${dimensions.height}&fit=crop&auto=format`;
  }

  if (!medium.width || !medium.height) {
    return medium.url;
  }

  // --- 1. MOBILE LOGIC ----

  const MAX_SIZE = 2200;
  const scale =
    medium.width > MAX_SIZE || medium.height > MAX_SIZE ? Math.min(MAX_SIZE / medium.width, MAX_SIZE / medium.height) : 1;

  let targetWidth = Math.round(medium.width * scale);
  let targetHeight = Math.round(medium.height * scale);

  if (isMobile) {
    const MOBILE_SCALE = 0.8;
    targetWidth = Math.round(medium.width * MOBILE_SCALE);
    targetHeight = Math.round(medium.height * MOBILE_SCALE);
  }

  return `${medium.url}?w=${targetWidth}&h=${targetHeight}&fit=crop&auto=format`;
};
