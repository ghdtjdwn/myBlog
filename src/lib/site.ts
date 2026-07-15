export const site = {
  name: "홍성주",
  title: "홍성주 — Engineering Notes",
  description:
    "실제로 운영되는 시스템을 만들고 성능, 장애, 의사결정을 증거로 기록하는 개발자 홍성주의 포트폴리오와 기술 블로그입니다.",
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
