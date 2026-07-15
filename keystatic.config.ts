import { collection, config, fields } from "@keystatic/core";

const storage = process.env.NODE_ENV === "production"
  ? { kind: "github" as const, repo: "ghdtjdwn/myBlog" as const }
  : { kind: "local" as const };

const textList = (label: string, description?: string) => fields.array(
  fields.text({ label: "항목" }),
  { label, description, itemLabel: (props) => props.value || "새 항목" },
);

const markdown = fields.mdx({
  label: "본문",
  extension: "md",
  options: {
    image: {
      directory: "src/assets/posts",
      publicPath: "../../assets/posts/",
    },
  },
});

export default config({
  storage,
  ui: {
    brand: { name: "홍성주의 개발 노트" },
    navigation: {
      "블로그": ["posts", "categories"],
      "포트폴리오": ["projects"],
      "엔지니어링 기록": ["decisions", "incidents"],
    },
  },
  collections: {
    posts: collection({
      label: "글",
      slugField: "title",
      path: "src/content/posts/*",
      format: { data: "yaml", contentField: "content" },
      entryLayout: "content",
      columns: ["title", "publishedAt", "draft"],
      schema: {
        title: fields.slug({ name: { label: "제목" } }),
        description: fields.text({ label: "요약", multiline: true, validation: { isRequired: true } }),
        publishedAt: fields.date({ label: "발행일", validation: { isRequired: true } }),
        updatedAt: fields.date({ label: "수정일" }),
        category: fields.relationship({ label: "카테고리", collection: "categories", validation: { isRequired: true } }),
        activity: fields.relationship({ label: "활동 분류", collection: "categories" }),
        tags: textList("태그"),
        project: fields.relationship({ label: "연결 프로젝트", collection: "projects" }),
        role: fields.text({ label: "내 역할", validation: { isRequired: true } }),
        evidence: textList("근거", "공개 주장에 대한 확인 가능한 근거"),
        validation: textList("검증"),
        limitations: textList("한계"),
        featured: fields.checkbox({ label: "대표 글", defaultValue: false }),
        draft: fields.checkbox({ label: "비공개 초안", defaultValue: true, description: "해제해야 공개 페이지에 표시됩니다." }),
        content: markdown,
      },
    }),
    categories: collection({
      label: "카테고리",
      slugField: "name",
      path: "src/content/categories/*",
      format: "yaml",
      columns: ["name", "order"],
      schema: {
        name: fields.slug({ name: { label: "이름" } }),
        description: fields.text({ label: "설명", multiline: true, validation: { isRequired: true } }),
        kind: fields.select({ label: "분류 종류", options: [
          { label: "직무 역량", value: "competency" }, { label: "활동 유형", value: "activity" },
        ], defaultValue: "competency" }),
        order: fields.integer({ label: "정렬 순서", defaultValue: 10 }),
      },
    }),
    projects: collection({
      label: "프로젝트",
      slugField: "title",
      path: "src/content/projects/*",
      format: { data: "yaml", contentField: "content" },
      entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "프로젝트명" } }),
        summary: fields.text({ label: "요약", multiline: true, validation: { isRequired: true } }),
        status: fields.select({ label: "상태", options: [
          { label: "운영 중", value: "operating" }, { label: "완료", value: "complete" },
          { label: "프로토타입", value: "prototype" }, { label: "계획", value: "planned" },
          { label: "보관", value: "archive" },
        ], defaultValue: "prototype" }),
        statusNote: fields.text({ label: "현재 상태 설명", multiline: true, validation: { isRequired: true } }),
        activity: fields.select({ label: "활동 유형", options: [
          { label: "개인 프로젝트", value: "personal" }, { label: "팀 프로젝트", value: "team" },
          { label: "공모전·대회", value: "competition" }, { label: "동아리", value: "club" },
          { label: "전공·학습", value: "coursework" }, { label: "기타", value: "other" },
        ], defaultValue: "personal" }),
        visibility: fields.select({ label: "공개 범위", options: [
          { label: "공개", value: "public" }, { label: "비공개", value: "private" }, { label: "혼합", value: "mixed" },
        ], defaultValue: "public" }),
        role: fields.text({ label: "내 역할", validation: { isRequired: true } }),
        teamScope: fields.text({ label: "팀 범위" }),
        contributionEvidence: textList("기여 근거"),
        image: fields.image({ label: "대표 이미지", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
        imageAlt: fields.text({ label: "이미지 대체 텍스트" }),
        tags: textList("기술 태그"),
        infra: textList("인프라"),
        metrics: fields.array(fields.object({
          label: fields.text({ label: "지표명" }), value: fields.text({ label: "값" }),
        }), { label: "검증된 지표", itemLabel: (props) => props.fields.label.value || "새 지표" }),
        order: fields.integer({ label: "정렬 순서", defaultValue: 10 }),
        featured: fields.checkbox({ label: "대표 프로젝트", defaultValue: false }),
        draft: fields.checkbox({ label: "비공개 초안", defaultValue: true }),
        live: fields.url({ label: "서비스 URL" }),
        repositories: fields.array(fields.object({
          label: fields.text({ label: "표시명" }), url: fields.url({ label: "저장소 URL" }),
        }), { label: "저장소", itemLabel: (props) => props.fields.label.value || "새 저장소" }),
        recordPlan: fields.text({ label: "작업 로그·트러블슈팅 운영 방식", multiline: true, validation: { isRequired: true } }),
        recordLinks: fields.array(fields.object({
          label: fields.text({ label: "표시명" }), url: fields.url({ label: "기록 URL" }),
        }), { label: "공개 엔지니어링 기록", itemLabel: (props) => props.fields.label.value || "새 기록" }),
        content: markdown,
      },
    }),
    decisions: collection({
      label: "ADR",
      slugField: "title",
      path: "src/content/decisions/*",
      format: { data: "yaml", contentField: "content" },
      entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "결정 제목" } }),
        decidedAt: fields.date({ label: "결정일", validation: { isRequired: true } }),
        status: fields.select({ label: "상태", options: [
          { label: "제안", value: "proposed" }, { label: "채택", value: "accepted" }, { label: "대체됨", value: "superseded" },
        ], defaultValue: "proposed" }),
        project: fields.relationship({ label: "연결 프로젝트", collection: "projects" }),
        draft: fields.checkbox({ label: "비공개 초안", defaultValue: true }),
        content: markdown,
      },
    }),
    incidents: collection({
      label: "트러블슈팅",
      slugField: "title",
      path: "src/content/incidents/*",
      format: { data: "yaml", contentField: "content" },
      entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "문제 제목" } }),
        occurredAt: fields.date({ label: "발생일", validation: { isRequired: true } }),
        project: fields.relationship({ label: "연결 프로젝트", collection: "projects", validation: { isRequired: true } }),
        impact: fields.text({ label: "영향", multiline: true, validation: { isRequired: true } }),
        validation: textList("검증"),
        draft: fields.checkbox({ label: "비공개 초안", defaultValue: true }),
        content: markdown,
      },
    }),
  },
});
