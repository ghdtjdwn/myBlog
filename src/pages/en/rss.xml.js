import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = await getCollection("postsEn", ({ data }) => !data.draft);
  return rss({
    title: "Hong Seong Ju's Engineering Notes",
    description: "Engineering notes on backend, data, AI systems, infrastructure, and technical decisions.",
    site: new URL("en/", context.site),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `writing/${post.id}/`,
    })),
  });
}
