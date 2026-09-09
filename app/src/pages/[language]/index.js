import Home from "@/pages/index";
import { getHomeStaticProps } from "@/lib/sanity/fetch";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export default Home;

export function getStaticPaths() {
  return {
    fallback: false,
    paths: SUPPORTED_LANGUAGES.map((language) => ({ params: { language } })),
  };
}

export const getStaticProps = getHomeStaticProps;
