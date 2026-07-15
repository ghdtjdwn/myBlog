import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { site } from "../lib/site";

export async function GET(context) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return rss({
    title: site.title,
    description: site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `writing/${post.id}/`,
    })),
  });
}
