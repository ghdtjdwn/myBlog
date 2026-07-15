export const site = {
  name: "홍성주",
  title: "홍성주의 개발 노트",
  description:
    "백엔드, 데이터, AI 시스템을 만들며 겪은 문제와 선택의 이유를 기록하는 개발자 홍성주의 기술 블로그입니다.",
  github: "https://github.com/ghdtjdwn",
  location: "Seoul, Korea",
};

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
