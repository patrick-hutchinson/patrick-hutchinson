import Project from "@/pages/projects/[slug]";
import { getProjectStaticPaths, getProjectStaticProps } from "@/lib/sanity/fetch";

export default Project;

export function getStaticPaths() {
  return getProjectStaticPaths({ includeLanguages: true });
}

export const getStaticProps = getProjectStaticProps;
