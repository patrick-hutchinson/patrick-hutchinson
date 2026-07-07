import Head from "next/head";
import { useMemo, useState } from "react";

import { DeviceProvider } from "@/context/DeviceContext";
import LenisProvider from "@/context/LenisContext";
import { ViewportProvider } from "@/context/ViewportContext";
import { fallbackSiteData } from "@/lib/sanity";
import Copyright from "@/components/Copyright/Copyright";
import FilterMenu from "@/components/FilterMenu/FilterMenu";
import Menu from "@/components/Menu/Menu";
import "@/styles/globals.css";
import "@/styles/fonts.css";

export default function App({ Component, pageProps }) {
  const site = pageProps.site || fallbackSiteData;
  // const [activeFilter, setActiveFilter] = useState(null);
  // const filterArray = useMemo(() => {
  //   const selection = pageProps.home?.selection || [];

  //   return [...new Set(selection.map((entry) => entry._type))];
  // }, [pageProps.home?.selection]);

  return (
    <>
      <Head>
        <title>{site.title}</title>
        {site.description ? <meta name="description" content={site.description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={site.faviconUrl} />
      </Head>
      <ViewportProvider>
        <DeviceProvider>
          <LenisProvider>
            <div className="controls">
              {/* {filterArray.length ? (
                <FilterMenu activeFilter={activeFilter} array={filterArray} onFilterChange={setActiveFilter} />
              ) : null} */}
              <Menu />
            </div>
            <Component
              {...pageProps}
              // activeFilter={activeFilter}
            />
            <Copyright className="copyright" />
          </LenisProvider>
        </DeviceProvider>
      </ViewportProvider>
    </>
  );
}
