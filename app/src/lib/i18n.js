export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_LANGUAGES = ["en", "de"];

export function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

export function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

export function getLocalizedPath(path = "/", language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  return `/${normalizedLanguage}${normalizedPath}`;
}
