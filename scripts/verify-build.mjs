import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist", "client");
const contentRoot = path.resolve("src", "content");
const required = [
  "index.html",
  "about/index.html",
  "projects/index.html",
  "writing/index.html",
  "writing/category/infrastructure/index.html",
  "writing/category/data/index.html",
  "writing/category/ai-systems/index.html",
  "writing/category/engineering/index.html",
  "writing/category/backend/index.html",
  "writing/category/troubleshooting/index.html",
  "writing/category/personal-project/index.html",
  "writing/category/competition/index.html",
  "writing/category/club/index.html",
  "writing/category/team-project/index.html",
  "writing/category/other/index.html",
  "robots.txt",
  "rss.xml",
  "en/index.html",
  "en/about/index.html",
  "en/projects/index.html",
  "en/writing/index.html",
  "en/writing/category/infrastructure/index.html",
  "en/rss.xml",
  "sitemap-index.xml",
];

const draftRoutes = [];

const contentRoutes = [
  { collection: "projects", prefix: "projects/" },
  { collection: "projects-en", prefix: "en/projects/" },
  { collection: "posts", prefix: "writing/" },
  { collection: "posts-en", prefix: "en/writing/" },
];

for (const { collection, prefix } of contentRoutes) {
  const directory = path.join(contentRoot, collection);
  for (const name of await readdir(directory)) {
    if (!/\.(?:md|mdx)$/.test(name)) continue;
    const source = await readFile(path.join(directory, name), "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
    const id = name.replace(/\.(?:md|mdx)$/, "");
    const route = `${prefix}${id}/index.html`;
    if (/^draft:\s*true\s*$/m.test(frontmatter)) draftRoutes.push(route);
    else required.push(route);
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : target;
    }),
  );
  return files.flat();
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const failures = [];
for (const file of required) {
  if (!(await exists(path.join(root, file)))) failures.push(`missing required output: ${file}`);
}
for (const file of draftRoutes) {
  if (await exists(path.join(root, file))) failures.push(`draft leaked into production output: ${file}`);
}

const files = (await walk(root)).filter((file) => /\.(?:html|xml|txt)$/.test(file));
for (const file of files) {
  const body = await readFile(file, "utf8");
  const relative = path.relative(root, file);
  if (/(?:[="'>]|&quot;)(?:undefined|null)(?:["'<]|&quot;)/.test(body)) failures.push(`unresolved rendered value in ${relative}`);
  const expectedLanguage = relative.startsWith(`en${path.sep}`) ? "en" : "ko";
  if (file.endsWith(".html") && !new RegExp(`<html\\b[^>]*\\blang="${expectedLanguage}"`).test(body)) failures.push(`missing ${expectedLanguage} document language in ${relative}`);
  if (file.endsWith(".html") && !body.includes('rel="canonical"')) failures.push(`missing canonical URL in ${relative}`);
  if (file.endsWith(".html") && !body.includes('hreflang="en"')) failures.push(`missing English alternate in ${relative}`);
  if (file.endsWith(".html") && !body.includes('hreflang="ko"')) failures.push(`missing Korean alternate in ${relative}`);
  if (file.endsWith(".html") && !body.includes('data-theme="')) failures.push(`missing managed theme in ${relative}`);
  if (file.endsWith(".html") && !body.includes('data-accent="')) failures.push(`missing managed accent in ${relative}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${files.length} generated text documents and draft isolation.`);
