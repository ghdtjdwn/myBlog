import { getEntry, type CollectionEntry } from "astro:content";
import { withBase } from "./site";

export type SiteSettings = CollectionEntry<"settings">["data"];

export async function getSiteSettings(): Promise<SiteSettings> {
  const entry = await getEntry("settings", "site");
  if (!entry) throw new Error("Missing required site settings entry: src/content/settings/site.yaml");
  return entry.data;
}

export function managedHref(href: string) {
  return /^(?:https?:\/\/|mailto:)/i.test(href) ? href : withBase(href);
}

export function isExternalHref(href: string) {
  return /^(?:https?:\/\/|mailto:)/i.test(href);
}
