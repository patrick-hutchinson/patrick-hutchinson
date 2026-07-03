import Head from "next/head";

import { fallbackSiteData } from "@/lib/sanity";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const site = pageProps.site || fallbackSiteData;

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
