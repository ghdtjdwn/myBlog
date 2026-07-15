import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const contentRoot = path.resolve("src/content");

async function ids(collection, extensionPattern = /\.(?:md|mdx)$/) {
  return new Set((await readdir(path.join(contentRoot, collection)))
    .filter((name) => extensionPattern.test(name))
    .map((name) => name.replace(/\.(?:md|mdx|yaml|yml)$/, "")));
}

function frontmatterValue(source, key) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  return frontmatter.match(new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)`, "m"))?.[1];
}

const categoryKinds = new Map();
for (const name of await readdir(path.join(contentRoot, "categories"))) {
  if (!/\.(?:yaml|yml)$/.test(name)) continue;
  const source = await readFile(path.join(contentRoot, "categories", name), "utf8");
  const id = name.replace(/\.(?:yaml|yml)$/, "");
  const kind = source.match(/^kind:\s*(competency|activity)\s*$/m)?.[1];
  if (kind) categoryKinds.set(id, kind);
}
const categoryIds = new Set(categoryKinds.keys());
const projectIds = await ids("projects");
const projectIdsEn = await ids("projects-en");
const failures = [];

for (const id of projectIds) if (!projectIdsEn.has(id)) failures.push(`projects-en: missing translation for '${id}'`);
for (const id of projectIdsEn) if (!projectIds.has(id)) failures.push(`projects-en: no Korean source for '${id}'`);

for (const collection of ["posts", "posts-en", "decisions", "incidents"]) {
  const directory = path.join(contentRoot, collection);
  for (const name of await readdir(directory)) {
    if (!/\.(?:md|mdx)$/.test(name)) continue;
    const source = await readFile(path.join(directory, name), "utf8");
    const category = frontmatterValue(source, "category");
    const activity = frontmatterValue(source, "activity");
    const project = frontmatterValue(source, "project");

    if ((collection === "posts" || collection === "posts-en") && (!category || !categoryIds.has(category))) {
      failures.push(`${collection}/${name}: unknown or missing category '${category ?? ""}'`);
    }
    if ((collection === "posts" || collection === "posts-en") && category && categoryKinds.get(category) !== "competency") {
      failures.push(`${collection}/${name}: primary category '${category}' must be a competency`);
    }
    if ((collection === "posts" || collection === "posts-en") && activity && !categoryIds.has(activity)) {
      failures.push(`${collection}/${name}: unknown activity '${activity}'`);
    }
    if ((collection === "posts" || collection === "posts-en") && activity && categoryKinds.get(activity) !== "activity") {
      failures.push(`${collection}/${name}: activity '${activity}' must be an activity category`);
    }
    const validProjects = collection === "posts-en" ? projectIdsEn : projectIds;
    if (project && !project.startsWith("TODO-") && !validProjects.has(project)) {
      failures.push(`${collection}/${name}: unknown project '${project}'`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified content relationships across ${categoryIds.size} categories and ${projectIds.size} bilingual projects.`);
