import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const categories = defineCollection({
  loader: glob({ base: "./src/content/categories", pattern: "**/*.{yaml,yml}" }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    nameEn: z.string(),
    descriptionEn: z.string(),
    kind: z.enum(["competency", "activity"]),
    order: z.number().int(),
    visible: z.boolean().default(true),
  }),
});

const settings = defineCollection({
  loader: glob({ base: "./src/content/settings", pattern: "*.{yaml,yml}" }),
  schema: z.object({
    authorNameKo: z.string(),
    authorNameEn: z.string(),
    siteTitleKo: z.string(),
    siteTitleEn: z.string(),
    siteDescriptionKo: z.string(),
    siteDescriptionEn: z.string(),
    brandSubtitleKo: z.string(),
    brandSubtitleEn: z.string(),
    footerTextKo: z.string(),
    footerTextEn: z.string(),
    home: z.object({
      introLabelKo: z.string(),
      introLabelEn: z.string(),
      headingKo: z.string(),
      headingEn: z.string(),
      summaryKo: z.string(),
      summaryEn: z.string(),
      recentPostsLabelKo: z.string(),
      recentPostsLabelEn: z.string(),
      featuredProjectsLabelKo: z.string(),
      featuredProjectsLabelEn: z.string(),
      recentPostCount: z.number().int().min(1).max(24),
      featuredProjectCount: z.number().int().min(1).max(12),
    }),
    contact: z.object({
      email: z.email(),
      github: z.url(),
      solvedAc: z.url().optional(),
      education: z.string(),
    }),
    appearance: z.object({
      theme: z.enum(["paper", "warm", "night"]),
      accent: z.enum(["blue", "green", "violet", "orange"]),
    }),
    navigation: z.array(z.object({
      labelKo: z.string(),
      labelEn: z.string(),
      hrefKo: z.string(),
      hrefEn: z.string(),
      showInHeader: z.boolean(),
      showInFooter: z.boolean(),
      newTab: z.boolean(),
    })),
  }),
});

const projectCollection = (base: string) => defineCollection({
  loader: glob({ base, pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    status: z.enum(["operating", "complete", "prototype", "planned", "archive"]),
    statusNote: z.string(),
    activity: z.enum(["personal", "team", "competition", "club", "coursework", "other"]),
    visibility: z.enum(["public", "private", "mixed"]),
    role: z.string(),
    teamScope: z.string().optional(),
    contributionEvidence: z.array(z.string()).default([]),
    image: image().optional(),
    imageAlt: z.string().optional(),
    screenshots: z.array(z.object({
      image: image(),
      alt: z.string(),
      caption: z.string(),
    })).default([]),
    tags: z.array(z.string()),
    infra: z.array(z.string()).default([]),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })),
    order: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    live: z.url().optional(),
    repositories: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
    recordPlan: z.string(),
    recordLinks: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});

const projects = projectCollection("./src/content/projects");
const projectsEn = projectCollection("./src/content/projects-en");

const postCollection = (base: string, projectCollectionName: "projects" | "projectsEn") => defineCollection({
  loader: glob({ base, pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: reference("categories"),
    activity: reference("categories").optional(),
    tags: z.array(z.string()),
    project: reference(projectCollectionName).optional(),
    role: z.string(),
    evidence: z.array(z.string()).min(1),
    validation: z.array(z.string()).min(1),
    limitations: z.array(z.string()).min(1),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const posts = postCollection("./src/content/posts", "projects");
const postsEn = postCollection("./src/content/posts-en", "projectsEn");

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

export const collections = { categories, decisions, incidents, posts, postsEn, projects, projectsEn, settings };
