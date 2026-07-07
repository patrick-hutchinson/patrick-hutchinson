import { getPreviewClient, getProductionClient } from "./client";
import {
  experienceQuery,
  homeQuery,
  infoQuery,
  projectQuery,
  projectSlugsQuery,
  publicityQuery,
  siteQuery,
} from "./queries";

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

export async function getExperience() {
  return getSanityClient().fetch(experienceQuery);
}

export async function getPublicity() {
  return getSanityClient().fetch(publicityQuery);
}

export async function getProject(slug) {
  return getSanityClient().fetch(projectQuery, { slug });
}

export async function getProjectSlugs() {
  return getSanityClient().fetch(projectSlugsQuery);
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
  const [site, info, experience, publicity] = await Promise.all([
    getSite(),
    getInfo(),
    getExperience(),
    getPublicity(),
  ]);

  return {
    props: {
      site,
      info,
      experience,
      publicity,
    },
    revalidate,
  };
}

export async function getProjectStaticPaths() {
  const slugs = await getProjectSlugs();

  return {
    paths: (slugs || []).map((entry) => ({
      params: {
        slug: entry.slug,
      },
    })),
    fallback: "blocking",
  };
}

export async function getProjectStaticProps({ params }) {
  const [site, project] = await Promise.all([getSite(), getProject(params?.slug)]);

  if (!project) {
    return {
      notFound: true,
      revalidate,
    };
  }

  return {
    props: {
      site,
      project,
    },
    revalidate,
  };
}
