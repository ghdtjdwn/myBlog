export const categoryEnglish = {
  "ai-systems": { name: "AI Systems", description: "Engineering reliable AI features with explicit evaluation, safety, and operational boundaries." },
  backend: { name: "Backend", description: "API, domain modeling, authentication, consistency, and server-side engineering." },
  club: { name: "Clubs & Communities", description: "Engineering work completed through clubs and developer communities." },
  competition: { name: "Competitions", description: "Projects and lessons from hackathons, contests, and public challenges." },
  data: { name: "Data", description: "Data pipelines, spatial queries, databases, measurement, and performance validation." },
  engineering: { name: "Engineering", description: "Architecture decisions, implementation trade-offs, testing, and maintainability." },
  infrastructure: { name: "Infrastructure", description: "Deployment, observability, cloud infrastructure, reliability, and operations." },
  other: { name: "Other", description: "Notes that do not fit a single engineering or activity category." },
  "personal-project": { name: "Personal Projects", description: "Products and experiments built independently from problem definition through operation." },
  "team-project": { name: "Team Projects", description: "Team engineering with explicit ownership, interfaces, and contribution boundaries." },
  troubleshooting: { name: "Troubleshooting", description: "Reproducible failures, evidence, root causes, fixes, and regression prevention." },
} as const;

export const projectStatusLabelsEn = {
  operating: "Operating & improving",
  complete: "Complete",
  prototype: "Prototype in progress",
  planned: "Planning",
  archive: "Learning archive",
} as const;

export const projectActivityLabelsEn = {
  personal: "Personal project",
  team: "Team project",
  competition: "Competition",
  club: "Club & community",
  coursework: "Coursework & study",
  other: "Other",
} as const;
