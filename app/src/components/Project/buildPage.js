import FullscreenMedium from "@/components/Project/FullscreenMedium/FullscreenMedium";
import ScaleGallery from "@/components/Project/ScaleGallery/ScaleGallery";

export const buildPage = (block, options = {}) => {
  if (!block) return null;

  const type = block._type;
  const { fallbackSubcaption, isMobile } = options;

  switch (type) {
    case "projectFullscreenMedium":
      return <FullscreenMedium block={block} fallbackSubcaption={fallbackSubcaption} />;
    case "projectScaleGallery":
      return <ScaleGallery block={block} fallbackSubcaption={fallbackSubcaption} isMobile={isMobile} />;
    default:
      return null;
  }
};
