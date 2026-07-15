import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ url }) => new Response(null, {
  status: 307,
  headers: {
    Location: new URL("/keystatic", url).toString(),
    "X-Robots-Tag": "noindex, nofollow",
  },
});
