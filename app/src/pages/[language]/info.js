import Info from "@/pages/info";
import { getInfoStaticProps } from "@/lib/sanity/fetch";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export default Info;

export function getStaticPaths() {
  return {
    fallback: false,
    paths: SUPPORTED_LANGUAGES.map((language) => ({ params: { language } })),
  };
}

export const getStaticProps = getInfoStaticProps;
