import { getPreviewClient, getProductionClient } from "./client";
import { homeQuery, infoQuery, siteQuery } from "./queries";

export const fallbackSiteData = {
  title: "Patrick Hutchinson",
  description: "",
  faviconUrl: "/favicon.ico",
};

const revalidate = 60;

export function getSanityClient() {
  const isProduction = process.env.VERCEL_ENV === "production";
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isLocal = !process.env.VERCEL_ENV;
  const hasReadToken = Boolean(process.env.SANITY_READ_TOKEN);

  if ((isPreview || isLocal) && hasReadToken) {
    return getPreviewClient();
  }

  if (isProduction || !hasReadToken) {
    return getProductionClient();
  }

  return getProductionClient();
}

function normalizeSite(site) {
  return {
    ...fallbackSiteData,
    ...site,
    faviconUrl: site?.favicon?.asset?.url || fallbackSiteData.faviconUrl,
  };
}

export async function getSite() {
  const site = await getSanityClient().fetch(siteQuery);

  return normalizeSite(site);
}

export async function getHome() {
  return getSanityClient().fetch(homeQuery);
}

export async function getInfo() {
  return getSanityClient().fetch(infoQuery);
}

export async function getHomeStaticProps() {
  const [site, home] = await Promise.all([getSite(), getHome()]);

  return {
    props: {
      site,
      home,
    },
    revalidate,
  };
}

export async function getInfoStaticProps() {
  const [site, info] = await Promise.all([getSite(), getInfo()]);

  return {
    props: {
      site,
      info,
    },
    revalidate,
  };
}
