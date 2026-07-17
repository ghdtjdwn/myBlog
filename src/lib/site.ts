export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return `${base}${path.replace(/^\//, "")}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateEn(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export const projectStatusLabels = {
  operating: "운영·개선 중",
  complete: "완료",
  prototype: "프로토타입·작업 중",
  planned: "기획·준비 중",
  archive: "학습 아카이브",
} as const;

export const projectActivityLabels = {
  personal: "개인 프로젝트",
  team: "팀 프로젝트",
  competition: "공모전·대회",
  club: "동아리·연합활동",
  coursework: "전공·학습",
  other: "기타",
} as const;

export const projectVisibilityLabels = {
  public: "공개 저장소·공개 근거",
  private: "비공개 원문·공개 가능한 범위만 요약",
  mixed: "공개·비공개 근거 혼합",
} as const;
