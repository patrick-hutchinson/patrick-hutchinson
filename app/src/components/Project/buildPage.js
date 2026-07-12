import FullscreenMedium from "@/components/Project/FullscreenMedium/FullscreenMedium";
import ProjectDescription from "@/components/Project/ProjectDescription/ProjectDescription";
import ScaleGallery from "@/components/Project/ScaleGallery/ScaleGallery";

export const buildPage = (block, options = {}) => {
  if (!block) return null;

  const type = block._type;
  const { fallbackSubcaption } = options;

  switch (type) {
    case "projectFullscreenMedium":
      return <FullscreenMedium block={block} fallbackSubcaption={fallbackSubcaption} />;
    case "projectScaleGallery":
      return <ScaleGallery block={block} fallbackSubcaption={fallbackSubcaption} />;
    default:
      return null;
  }
};
