---
title: "Production Ready인데 본진 주소가 이전 버전을 보여준 이유"
description: "Git과 Vercel 배포는 성공했지만 수동 .vercel.app alias가 과거 deployment에 고정돼 있던 문제를 진단하고 rollback 가능한 승격 절차로 바꾼 기록입니다."
publishedAt: 2026-07-17
category: infrastructure
activity: personal-project
tags: ["Vercel", "Release Engineering", "Post-deployment Verification", "Rollback"]
role: "개인 기술 블로그의 Vercel 배포 진단, alias 승격·rollback과 공개 검증 절차 설계"
evidence:
  - "myBlog의 vercel-primary-alias-stale troubleshooting 기록"
  - "Git commit, Production deployment ID, alias source와 실제 공개 응답 비교"
validation:
  - "승격 전후 alias deployment ID와 검증한 Production ID 일치 확인"
  - "한국어·영어 홈과 프로젝트, canonical·HSTS·보안 header를 본진 주소에서 확인"
limitations:
  - "현재 승격은 수동 단계라 누락 가능성이 남아 있음"
  - "개인 domain의 자동 Production assignment나 제한된 credential 기반 자동화는 아직 도입하지 않음"
featured: false
draft: false
---

## 초록색 세 개가 사용자에게 최신 화면을 보장하지 않았다

프로젝트 설명을 수정한 pull request의 GitHub CI가 통과했고, main commit에 연결된 Vercel Production도 `Ready`였습니다. 고유 deployment URL에서는 새 한국어·영어 콘텐츠가 보였습니다. 그러나 채용 자료에 적은 `seongju.vercel.app`은 계속 이전 내용을 제공했습니다.

처음에는 CDN cache나 Astro build 누락을 의심했습니다. 네 상태를 따로 비교했습니다.

```text
GitHub main commit          latest
Vercel production build    Ready, latest content
unique deployment URL      latest content
seongju.vercel.app alias   previous deployment
```

`vercel inspect`에서 본진 주소와 최신 Production의 deployment ID가 달랐습니다. `vercel alias ls`는 짧은 주소가 과거 deployment source에 직접 연결돼 있음을 보여줬습니다. cache가 오래된 문서를 주는 것이 아니라 요청 자체가 옛 deployment로 갔습니다.

## project domain과 수동 deployment alias는 수명이 다르다

짧은 `.vercel.app` 이름은 project setting의 자동 Production domain이 아니라 이전에 `vercel alias set`으로 특정 deployment에 붙인 주소였습니다. 새 Git deployment가 성공해도 이 수동 mapping은 자동으로 이동하지 않았습니다.

이 차이를 모르고 “Production Ready”만 완료 조건으로 삼은 것이 근본 원인이었습니다. build artifact와 deployment는 정상이었기 때문에 재배포를 반복해도 alias는 그대로였을 것입니다.

## 승격 전에 rollback 값을 먼저 확보한다

수동 alias를 계속 쓰기로 했지만 명령 한 번으로 바로 덮어쓰지는 않았습니다. 다음 순서를 release checklist로 만들었습니다.

1. GitHub main CI와 연결된 Vercel Production이 모두 성공했는지 확인한다.
2. 그 commit의 고유 deployment URL을 `inspect`해 project, production target, `Ready`를 확인한다.
3. 현재 본진 alias의 deployment URL과 ID를 rollback 값으로 기록한다.
4. 검증한 URL에만 `vercel alias set`을 실행한다.
5. 본진을 다시 inspect해 deployment ID가 일치하는지 확인한다.
6. 한국어·영어 핵심 경로와 metadata·보안 header를 실제 본진에서 검사한다.
7. 하나라도 실패하면 기록한 이전 deployment로 alias를 되돌린다.

“최근 deployment”를 선택하지 않고 main commit과 연결된 고유 URL을 찾는 이유는 preview나 실패 뒤 생성된 다른 artifact를 잘못 승격하지 않기 위해서입니다.

## post-deployment verification은 본진에서 끝낸다

승격 뒤 본진 alias와 최종 Production의 deployment ID가 같아졌습니다. 한국어·영어 홈과 대표 프로젝트가 200을 반환하고 새 문구를 포함하는지 확인했습니다. canonical은 본진 주소를 가리켰고 HSTS, MIME sniffing 방지, frame 차단과 referrer 정책도 유지됐습니다.

CI는 source와 build를 검증하고, hosting status는 deployment를 검증합니다. 사용자가 실제로 찾는 주소는 별도의 routing object일 수 있습니다. 그래서 release 완료 조건에 public alias의 content probe를 추가했습니다.

현재 절차는 수동이라 사람이 승격을 잊을 위험이 남습니다. 배포 빈도가 늘면 project setting에 연결되는 개인 domain이나 범위가 제한된 credential·승인 gate를 검토할 수 있습니다. 낮은 배포 빈도에서는 장기 token과 자동화 실패 경로를 추가하지 않고, rollback 가능한 수동 절차와 검증을 명시하는 선택을 했습니다.
