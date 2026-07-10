import FullscreenMedium from "@/components/Project/FullscreenMedium/FullscreenMedium";
import ProjectDescription from "@/components/Project/ProjectDescription/ProjectDescription";
import ScaleGallery from "@/components/Project/ScaleGallery/ScaleGallery";

export const buildPage = (block) => {
  if (!block) return null;

  const type = block._type;

  switch (type) {
    case "projectDescription":
      return <ProjectDescription block={block} />;
    case "projectFullscreenMedium":
      return <FullscreenMedium block={block} />;
    case "projectScaleGallery":
      return <ScaleGallery block={block} />;
    default:
      return null;
  }
};
