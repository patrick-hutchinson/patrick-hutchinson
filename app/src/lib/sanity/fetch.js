import { getPreviewClient, getProductionClient } from "./client";
import {
  experienceQuery,
  homeQuery,
  infoQuery,
  projectNavigationQuery,
  projectQuery,
  projectSlugsQuery,
  publicityQuery,
  siteQuery,
} from "./queries";
import { DEFAULT_LANGUAGE, normalizeLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n";

export const fallbackSiteData = {
  title: "Patrick Hutchinson",
  description: "",
  faviconUrl: "/favicon.ico",
};

const revalidate = 60;

function getLastUpdatedAt() {
  if (process.env.SITE_LAST_UPDATED_AT) {
    return process.env.SITE_LAST_UPDATED_AT;
  }

  try {
    const { execFileSync } = require("node:child_process");

    return execFileSync("git", ["log", "-1", "--format=%cI"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
  } catch {
    return new Date().toISOString();
  }
}

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

export async function getHome(language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(homeQuery, { language: normalizeLanguage(language) });
}

export async function getInfo(language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(infoQuery, { language: normalizeLanguage(language) });
}

export async function getExperience(language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(experienceQuery, { language: normalizeLanguage(language) });
}

export async function getPublicity(language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(publicityQuery, { language: normalizeLanguage(language) });
}

export async function getProject(slug, language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(projectQuery, { slug, language: normalizeLanguage(language) });
}

export async function getProjectNavigation(language = DEFAULT_LANGUAGE) {
  return getSanityClient().fetch(projectNavigationQuery, { language: normalizeLanguage(language) });
}

export async function getProjectSlugs() {
  return getSanityClient().fetch(projectSlugsQuery);
}

export async function getHomeStaticProps(context = {}) {
  const language = normalizeLanguage(context.params?.language);
  const [site, home] = await Promise.all([getSite(), getHome(language)]);

  return {
    props: {
      site,
      home,
      language,
    },
    revalidate,
  };
}

export async function getInfoStaticProps(context = {}) {
  const language = normalizeLanguage(context.params?.language);
  const [site, info, experience, publicity] = await Promise.all([
    getSite(),
    getInfo(language),
    getExperience(language),
    getPublicity(language),
  ]);

  return {
    props: {
      site,
      info,
      experience,
      publicity,
      language,
      lastUpdatedAt: getLastUpdatedAt(),
    },
    revalidate,
  };
}

export async function getProjectStaticPaths(context = {}) {
  const slugs = await getProjectSlugs();
  const includeLanguages = Boolean(context.includeLanguages);

  return {
    paths: (slugs || []).flatMap((entry) =>
      includeLanguages
        ? SUPPORTED_LANGUAGES.map((language) => ({ params: { language, slug: entry.slug } }))
        : [{ params: { slug: entry.slug } }],
    ),
    fallback: "blocking",
  };
}

export async function getProjectStaticProps({ params }) {
  const language = normalizeLanguage(params?.language);
  const [site, project, navigation] = await Promise.all([
    getSite(),
    getProject(params?.slug, language),
    getProjectNavigation(language),
  ]);

  if (!project) {
    return {
      notFound: true,
      revalidate,
    };
  }

  const projects = (navigation || []).filter((entry) => entry?._type === "project" && entry?.slug?.current);
  const projectIndex = projects.findIndex((entry) => entry.slug.current === params?.slug);
  const nextProject = projectIndex >= 0 ? projects[(projectIndex + 1) % projects.length] : null;

  return {
    props: {
      site,
      project,
      nextProject,
      language,
      lastUpdatedAt: getLastUpdatedAt(),
    },
    revalidate,
  };
}
