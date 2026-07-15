import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import keystatic from "@keystatic/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://seongju.vercel.app",
  base: (process.env.BASE_PATH ?? "/").replace(/\/?$/, "/"),
  output: "static",
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap(), keystatic()],
  markdown: {
    shikiConfig: {
      theme: "github-dark-default",
      wrap: true,
    },
  },
});
