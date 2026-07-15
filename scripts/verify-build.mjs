import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const required = [
  "index.html",
  "about/index.html",
  "projects/index.html",
  "projects/ssu-platform/index.html",
  "projects/geuneul/index.html",
  "writing/index.html",
  "robots.txt",
  "rss.xml",
  "sitemap-index.xml",
];

const draftRoutes = [
  "projects/redbean-overflow/index.html",
  "writing/postgis-expiry-index/index.html",
  "writing/arm64-gitops-image-drift/index.html",
  "writing/deterministic-ai-grader/index.html",
];

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
  if (file.endsWith(".html") && !body.includes('<html lang="ko">')) failures.push(`missing Korean document language in ${relative}`);
  if (file.endsWith(".html") && !body.includes('rel="canonical"')) failures.push(`missing canonical URL in ${relative}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${files.length} generated text documents and draft isolation.`);
