const DEFAULT_RENDITION = "highest.mp4";

export function getProjectThumbnailMedia(project, isMobile = false) {
  const mobileThumbnail = project?.thumbnail_mobile?.medium;
  const desktopThumbnail = project?.thumbnail?.medium;
  const mobileCover = project?.coverMedia_mobile?.medium;
  const desktopCover = project?.coverMedia?.medium;

  if (isMobile) return mobileThumbnail || desktopThumbnail || mobileCover || desktopCover;
  return desktopThumbnail || mobileThumbnail || desktopCover || mobileCover;
}

export function getVideoRenditionUrl(medium, rendition = DEFAULT_RENDITION) {
  if (!medium?.playbackId) return null;

  const selectedRendition = medium.staticRendition || rendition;
  const renditionName =
    selectedRendition.endsWith(".mp4") || selectedRendition.endsWith(".m4a")
      ? selectedRendition
      : `${selectedRendition}.mp4`;

  return `https://stream.mux.com/${medium.playbackId}/${renditionName}`;
}

export function getMediumPreviewImageUrl(medium, width = 160) {
  if (!medium) return null;

  if (medium.type === "image" && medium.url) {
    const separator = medium.url.includes("?") ? "&" : "?";
    return `${medium.url}${separator}w=${width}&fit=crop&auto=format`;
  }

  if (medium.type === "video" && medium.playbackId) {
    return `https://image.mux.com/${medium.playbackId}/thumbnail.jpg?width=${width}`;
  }

  return null;
}

export function preloadImageUrl(url) {
  if (typeof window === "undefined" || !url) return;

  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image;
}

export function preloadMedium(medium) {
  if (typeof window === "undefined" || !medium) return;

  if (medium.type === "image" && medium.url) {
    return preloadImageUrl(medium.url);
  }

  if (medium.type === "video") {
    const src = getVideoRenditionUrl(medium);
    if (!src) return;

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = src;
    video.load();
    return video;
  }
}
