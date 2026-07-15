import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site);
  const directive = process.env.VERCEL_ENV === "preview" ? "Disallow: /" : "Allow: /";
  return new Response(`User-agent: *\n${directive}\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
