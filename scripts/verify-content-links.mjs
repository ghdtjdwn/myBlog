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

const categoryIds = await ids("categories", /\.(?:yaml|yml)$/);
const projectIds = await ids("projects");
const failures = [];

for (const collection of ["posts", "decisions", "incidents"]) {
  const directory = path.join(contentRoot, collection);
  for (const name of await readdir(directory)) {
    if (!/\.(?:md|mdx)$/.test(name)) continue;
    const source = await readFile(path.join(directory, name), "utf8");
    const category = frontmatterValue(source, "category");
    const project = frontmatterValue(source, "project");

    if (collection === "posts" && (!category || !categoryIds.has(category))) {
      failures.push(`${collection}/${name}: unknown or missing category '${category ?? ""}'`);
    }
    if (project && !project.startsWith("TODO-") && !projectIds.has(project)) {
      failures.push(`${collection}/${name}: unknown project '${project}'`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified content relationships across ${categoryIds.size} categories and ${projectIds.size} projects.`);
