# 성공한 Production이 본진 alias에 반영되지 않은 문제

- 발생일: 2026-07-15
- 영향 범위: `https://seongju.vercel.app` 공개 포트폴리오
- 상태: 원인 확인과 운영 절차 수정 완료, 최종 문서 Production 승격 대기
- 사용자 영향: 데이터·인증 영향은 없었으나 채용 제출 주소가 오래된 프로젝트 설명을 제공

## 맥락과 기대 동작

프로젝트 콘텐츠 pull request와 CI를 병합하면 Vercel Git Integration이 `main`의 Production을
만든다. GitHub validate·secret-scan과 Vercel Production이 성공한 뒤 본진 주소도 같은
deployment로 이동해 최신 한국어·영어 콘텐츠를 제공할 것으로 기대했다.

## 실제 동작과 타임라인

17시 42분경 최종 문서 commit `1d21d01`의 Production이 Ready가 됐다. 그러나 실제 본진을
확인하니 그늘은 계속 운영·개선 중인 프로젝트로, Macro는 좌표 기반 자동화로 표시됐다.

- `vercel inspect seongju.vercel.app`: 12시 15분에 만든 이전 deployment를 반환
- 최신 Production 고유 URL: Macro의 UIA 우선 구조와 그늘의 개발 완료 상태를 반환
- `vercel alias ls`: `seongju.vercel.app`이 이전 deployment source에 직접 연결됨
- GitHub main CI와 최신 Vercel deployment: 모두 성공

따라서 공개 주소만 오래된 상태였고 새 build 자체는 정상임을 확인했다.

## 조사한 가설과 증거

1. CDN cache: alias를 inspect한 결과 deployment ID 자체가 달라 제외했다.
2. Astro build 또는 콘텐츠 동기화 실패: 최신 고유 URL에서 새 문구와 canonical이 보여 제외했다.
3. Git Integration 실패: commit과 연결된 Production status가 success이고 최신 build가 Ready라
   제외했다.
4. 수동 alias 고정: alias 목록이 이전 deployment와 본진 주소를 직접 연결해 근본 원인으로
   확인했다.

## 근본 원인

`seongju.vercel.app`은 프로젝트 설정에 등록한 custom production domain이 아니다. 짧은
`.vercel.app` 이름을 확보하기 위해 `vercel alias set`으로 한 deployment에 직접 붙인 수동
alias다. Vercel은 프로젝트 설정의 custom domain을 새 Production에 자동 적용하지만, 이
수동 mapping은 Git deployment 성공만으로 이동하지 않았다.

공식 문서도 project custom domain은 새 Production에 자동 적용하고, 특정 deployment에
주소를 직접 붙일 때는 [`vercel alias set`](https://vercel.com/docs/cli/alias)을 사용한다고
구분한다. 일반 custom domain의 자동 동작은
[`Deploying & Redirecting Domains`](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)에 설명돼 있다.

## 검토한 대안

- 자동 project domain인 `seongju-engineering-notes.vercel.app`을 본진으로 복귀: 자동 갱신은
  되지만 이미 프로필·canonical·제출 자료에 통일한 짧은 주소를 포기해야 해 제외했다.
- 개인 domain을 구매해 project settings에 연결: 장기적으로 가장 안정적이지만 이름·비용에
  대한 사용자 결정이 필요한 별도 범위다.
- Vercel token을 GitHub secret으로 등록하고 alias workflow를 추가: 자동화는 가능하지만 낮은
  배포 빈도에 비해 장기 credential, 권한과 실패 경로가 늘어 제외했다.
- 최종 배포의 수동 승격과 검증: 추가 secret 없이 즉시 복구할 수 있어 현재 선택했다.

## 해결

1. 최종 문서 pull request와 main CI, Vercel Production이 모두 성공할 때까지 기다린다.
2. GitHub의 해당 main commit deployment와 status에서 Vercel 고유 URL을 얻는다.
3. 그 URL을 `vercel inspect`해 project `seongju`, target `production`, status `Ready`를 모두
   확인한다. 단순히 가장 최근에 보이는 deployment를 선택하지 않는다.
4. 변경 전 `vercel inspect seongju.vercel.app`과 `vercel alias ls`에서 이전 deployment URL과
   ID를 rollback 값으로 기록한다.
5. `vercel alias set <verified-deployment-url> seongju.vercel.app`으로 본진을 이동한다.
6. `vercel inspect seongju.vercel.app`의 deployment ID가 검증한 값과 일치하는지 확인한다.
7. 한·영 홈, Macro, Geuneul, canonical과 보안 헤더를 실제 본진에서 검사한다.
8. 하나라도 실패하면 `vercel alias set <previous-deployment-url> seongju.vercel.app`으로 즉시
   되돌리고 원인을 조사한다.

## 검증

최종 승격 뒤 다음 조건을 모두 확인한다.

- 본진 alias와 최종 Production의 deployment ID 일치
- 한국어·영어 홈, Macro와 Geuneul 경로 HTTP 200
- Macro의 `69 tests · Linux/Windows CI`, UIA와 `awaiting_handoff` 설명 노출
- Geuneul의 개발 완료와 상시 가용성 비보장 설명 노출
- canonical이 `seongju.vercel.app`이고 HSTS, MIME sniffing 방지, frame 차단, referrer 정책 유지
- 실패 시 보존한 이전 deployment로 alias rollback 가능

## 회귀 방지와 남은 위험

README와 프로젝트 `AGENTS.md`의 Production 체크리스트에 alias 승격을 추가했다. 이후에는
Vercel status success를 공개 완료로 간주하지 않고 고유 deployment와 본진 alias를 각각
inspect한다.

수동 단계는 누락될 수 있다. 배포 빈도가 높아지면 개인 domain을 project settings에 등록해
자동 Production assignment를 사용하거나, 범위가 제한된 배포 자격증명과 승인 gate로 승격을
자동화하는 방안을 다시 검토한다.

## 인터뷰에서 설명할 질문

- CI와 hosting status가 모두 성공했는데 사용자는 왜 이전 버전을 봤는가?
- deployment URL, project domain과 수동 alias는 어떻게 다른가?
- token 기반 자동화보다 수동 승격을 선택한 기준은 무엇인가?
- 같은 배포 누락을 어떤 post-deployment check로 막았는가?
