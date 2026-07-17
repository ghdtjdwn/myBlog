import { collection, config, fields, singleton } from "@keystatic/core";

const storage = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_GITHUB_MODE === "true"
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
      "사이트 관리": ["site"],
      "블로그": ["posts", "postsEn", "categories"],
      "포트폴리오": ["projects", "projectsEn"],
      "엔지니어링 기록": ["decisions", "incidents"],
    },
  },
  singletons: {
    site: singleton({
      label: "사이트 설정",
      path: "src/content/settings/site",
      format: "yaml",
      schema: {
        authorNameKo: fields.text({ label: "작성자 이름 (한국어)", validation: { isRequired: true } }),
        authorNameEn: fields.text({ label: "작성자 이름 (English)", validation: { isRequired: true } }),
        siteTitleKo: fields.text({ label: "사이트 제목 (한국어)", validation: { isRequired: true } }),
        siteTitleEn: fields.text({ label: "Site title (English)", validation: { isRequired: true } }),
        siteDescriptionKo: fields.text({ label: "사이트 설명 (한국어)", multiline: true, validation: { isRequired: true } }),
        siteDescriptionEn: fields.text({ label: "Site description (English)", multiline: true, validation: { isRequired: true } }),
        brandSubtitleKo: fields.text({ label: "헤더 짧은 설명 (한국어)", validation: { isRequired: true } }),
        brandSubtitleEn: fields.text({ label: "Header subtitle (English)", validation: { isRequired: true } }),
        footerTextKo: fields.text({ label: "푸터 문구 (한국어)", multiline: true, validation: { isRequired: true } }),
        footerTextEn: fields.text({ label: "Footer text (English)", multiline: true, validation: { isRequired: true } }),
        home: fields.object({
          introLabelKo: fields.text({ label: "인사말 (한국어)", validation: { isRequired: true } }),
          introLabelEn: fields.text({ label: "Intro label (English)", validation: { isRequired: true } }),
          headingKo: fields.text({ label: "대표 제목 (한국어)", validation: { isRequired: true } }),
          headingEn: fields.text({ label: "Hero heading (English)", validation: { isRequired: true } }),
          summaryKo: fields.text({ label: "소개 문장 (한국어)", multiline: true, validation: { isRequired: true } }),
          summaryEn: fields.text({ label: "Introduction (English)", multiline: true, validation: { isRequired: true } }),
          recentPostsLabelKo: fields.text({ label: "최근 글 제목 (한국어)", validation: { isRequired: true } }),
          recentPostsLabelEn: fields.text({ label: "Recent posts title (English)", validation: { isRequired: true } }),
          featuredProjectsLabelKo: fields.text({ label: "대표 프로젝트 제목 (한국어)", validation: { isRequired: true } }),
          featuredProjectsLabelEn: fields.text({ label: "Featured projects title (English)", validation: { isRequired: true } }),
          recentPostCount: fields.integer({ label: "홈에 표시할 최근 글 수", defaultValue: 6 }),
          featuredProjectCount: fields.integer({ label: "홈에 표시할 대표 프로젝트 수", defaultValue: 3 }),
        }, { label: "홈 화면" }),
        contact: fields.object({
          email: fields.text({ label: "이메일", validation: { isRequired: true } }),
          github: fields.url({ label: "GitHub URL", validation: { isRequired: true } }),
          solvedAc: fields.url({ label: "solved.ac URL" }),
          education: fields.text({ label: "학력 표시", validation: { isRequired: true } }),
        }, { label: "프로필과 연락처" }),
        appearance: fields.object({
          theme: fields.select({
            label: "배경 테마",
            options: [
              { label: "밝은 회색", value: "paper" },
              { label: "따뜻한 아이보리", value: "warm" },
              { label: "어두운 밤", value: "night" },
            ],
            defaultValue: "paper",
          }),
          accent: fields.select({
            label: "강조 색상",
            options: [
              { label: "파랑", value: "blue" },
              { label: "초록", value: "green" },
              { label: "보라", value: "violet" },
              { label: "주황", value: "orange" },
            ],
            defaultValue: "blue",
          }),
        }, { label: "화면 스타일" }),
        navigation: fields.array(fields.object({
          labelKo: fields.text({ label: "메뉴 이름 (한국어)", validation: { isRequired: true } }),
          labelEn: fields.text({ label: "Menu label (English)", validation: { isRequired: true } }),
          hrefKo: fields.text({ label: "한국어 경로 또는 URL", validation: { isRequired: true }, description: "예: writing/ 또는 https://example.com" }),
          hrefEn: fields.text({ label: "English path or URL", validation: { isRequired: true }, description: "예: en/writing/ 또는 https://example.com" }),
          showInHeader: fields.checkbox({ label: "상단 메뉴에 표시", defaultValue: true }),
          showInFooter: fields.checkbox({ label: "하단 메뉴에 표시", defaultValue: false }),
          newTab: fields.checkbox({ label: "새 탭에서 열기", defaultValue: false }),
        }), {
          label: "메뉴",
          description: "항목을 드래그해 순서를 바꿀 수 있습니다. 내부 경로는 사이트 기준으로 자동 연결됩니다.",
          itemLabel: (props) => props.fields.labelKo.value || "새 메뉴",
        }),
      },
    }),
  },
  collections: {
    postsEn: collection({
      label: "글 (English)", slugField: "title", path: "src/content/posts-en/*",
      format: { data: "yaml", contentField: "content" }, entryLayout: "content", columns: ["title", "publishedAt", "draft"],
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        description: fields.text({ label: "Summary", multiline: true, validation: { isRequired: true } }),
        publishedAt: fields.date({ label: "Published", validation: { isRequired: true } }),
        updatedAt: fields.date({ label: "Updated" }),
        category: fields.relationship({ label: "Category", collection: "categories", validation: { isRequired: true } }),
        activity: fields.relationship({ label: "Activity", collection: "categories" }),
        tags: textList("Tags"),
        project: fields.relationship({ label: "Project", collection: "projectsEn" }),
        role: fields.text({ label: "My role", validation: { isRequired: true } }),
        evidence: textList("Evidence"), validation: textList("Validation"), limitations: textList("Limitations"),
        featured: fields.checkbox({ label: "Featured", defaultValue: false }),
        draft: fields.checkbox({ label: "Private draft", defaultValue: true }), content: markdown,
      },
    }),
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
      columns: ["name", "kind", "order", "visible"],
      schema: {
        name: fields.slug({ name: { label: "이름" } }),
        description: fields.text({ label: "설명", multiline: true, validation: { isRequired: true } }),
        nameEn: fields.text({ label: "영문 이름", validation: { isRequired: true } }),
        descriptionEn: fields.text({ label: "영문 설명", multiline: true, validation: { isRequired: true } }),
        kind: fields.select({ label: "분류 종류", options: [
          { label: "직무 역량", value: "competency" }, { label: "활동 유형", value: "activity" },
        ], defaultValue: "competency" }),
        order: fields.integer({ label: "정렬 순서", description: "작은 숫자일수록 앞에 표시됩니다.", defaultValue: 10 }),
        visible: fields.checkbox({ label: "카테고리 메뉴에 표시", defaultValue: true }),
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
        architecture: fields.array(fields.object({
          image: fields.image({ label: "아키텍처 이미지", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
          alt: fields.text({ label: "대체 텍스트", validation: { isRequired: true } }),
          caption: fields.text({ label: "설명", multiline: true, validation: { isRequired: true } }),
        }), { label: "서비스 아키텍처", itemLabel: (props) => props.fields.caption.value || "새 아키텍처" }),
        screenshots: fields.array(fields.object({
          image: fields.image({ label: "화면 이미지", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
          alt: fields.text({ label: "대체 텍스트", validation: { isRequired: true } }),
          caption: fields.text({ label: "설명", multiline: true, validation: { isRequired: true } }),
        }), { label: "프로젝트 화면", itemLabel: (props) => props.fields.caption.value || "새 화면" }),
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
    projectsEn: collection({
      label: "프로젝트 (English)", slugField: "title", path: "src/content/projects-en/*",
      format: { data: "yaml", contentField: "content" }, entryLayout: "content",
      schema: {
        title: fields.slug({ name: { label: "Project name" } }),
        summary: fields.text({ label: "Summary", multiline: true, validation: { isRequired: true } }),
        status: fields.select({ label: "Status", options: [
          { label: "Operating", value: "operating" }, { label: "Complete", value: "complete" },
          { label: "Prototype", value: "prototype" }, { label: "Planned", value: "planned" }, { label: "Archive", value: "archive" },
        ], defaultValue: "prototype" }),
        statusNote: fields.text({ label: "Current status", multiline: true, validation: { isRequired: true } }),
        activity: fields.select({ label: "Activity", options: [
          { label: "Personal", value: "personal" }, { label: "Team", value: "team" }, { label: "Competition", value: "competition" },
          { label: "Club", value: "club" }, { label: "Coursework", value: "coursework" }, { label: "Other", value: "other" },
        ], defaultValue: "personal" }),
        visibility: fields.select({ label: "Visibility", options: [
          { label: "Public", value: "public" }, { label: "Private", value: "private" }, { label: "Mixed", value: "mixed" },
        ], defaultValue: "public" }),
        role: fields.text({ label: "My role", validation: { isRequired: true } }), teamScope: fields.text({ label: "Team scope" }),
        contributionEvidence: textList("Contribution evidence"),
        image: fields.image({ label: "Cover image", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
        imageAlt: fields.text({ label: "Image alt text" }),
        architecture: fields.array(fields.object({
          image: fields.image({ label: "Architecture image", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
          alt: fields.text({ label: "Alt text", validation: { isRequired: true } }),
          caption: fields.text({ label: "Caption", multiline: true, validation: { isRequired: true } }),
        }), { label: "Service architecture", itemLabel: (props) => props.fields.caption.value || "New architecture" }),
        screenshots: fields.array(fields.object({
          image: fields.image({ label: "Screen image", directory: "src/assets/projects", publicPath: "../../assets/projects/" }),
          alt: fields.text({ label: "Alt text", validation: { isRequired: true } }),
          caption: fields.text({ label: "Caption", multiline: true, validation: { isRequired: true } }),
        }), { label: "Project screens", itemLabel: (props) => props.fields.caption.value || "New screen" }),
        tags: textList("Tags"), infra: textList("Infrastructure"),
        metrics: fields.array(fields.object({ label: fields.text({ label: "Metric" }), value: fields.text({ label: "Value" }) }), { label: "Verified metrics", itemLabel: (props) => props.fields.label.value || "New metric" }),
        order: fields.integer({ label: "Order", defaultValue: 10 }), featured: fields.checkbox({ label: "Featured", defaultValue: false }),
        draft: fields.checkbox({ label: "Private draft", defaultValue: true }), live: fields.url({ label: "Live URL" }),
        repositories: fields.array(fields.object({ label: fields.text({ label: "Label" }), url: fields.url({ label: "Repository URL" }) }), { label: "Repositories", itemLabel: (props) => props.fields.label.value || "Repository" }),
        recordPlan: fields.text({ label: "Work log and troubleshooting policy", multiline: true, validation: { isRequired: true } }),
        recordLinks: fields.array(fields.object({ label: fields.text({ label: "Label" }), url: fields.url({ label: "Record URL" }) }), { label: "Engineering records", itemLabel: (props) => props.fields.label.value || "Record" }),
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
