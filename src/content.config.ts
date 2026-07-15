import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const categories = defineCollection({
  loader: glob({ base: "./src/content/categories", pattern: "**/*.{yaml,yml}" }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    order: z.number().int(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["operating", "complete", "prototype", "planned", "archive"]),
    visibility: z.enum(["public", "private", "mixed"]),
    role: z.string(),
    teamScope: z.string().optional(),
    contributionEvidence: z.array(z.string()).default([]),
    image: image().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()),
    infra: z.array(z.string()).default([]),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })),
    order: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    live: z.url().optional(),
    repositories: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: reference("categories"),
    tags: z.array(z.string()),
    project: reference("projects").optional(),
    role: z.string(),
    evidence: z.array(z.string()).min(1),
    validation: z.array(z.string()).min(1),
    limitations: z.array(z.string()).min(1),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const decisions = defineCollection({
  loader: glob({ base: "./src/content/decisions", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    decidedAt: z.coerce.date(),
    status: z.enum(["proposed", "accepted", "superseded"]),
    project: reference("projects").optional(),
    draft: z.boolean().default(false),
  }),
});

const incidents = defineCollection({
  loader: glob({ base: "./src/content/incidents", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    occurredAt: z.coerce.date(),
    project: reference("projects"),
    impact: z.string(),
    validation: z.array(z.string()).min(1),
    draft: z.boolean().default(true),
  }),
});

export const collections = { categories, decisions, incidents, posts, projects };
