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
