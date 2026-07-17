import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getSiteSettings } from "../lib/settings";

export async function GET(context) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const settings = await getSiteSettings();
  return rss({
    title: settings.siteTitleKo,
    description: settings.siteDescriptionKo,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `writing/${post.id}/`,
    })),
  });
}
