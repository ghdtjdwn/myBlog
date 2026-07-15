# 첫 GitHub Actions secret scan의 root commit 범위 실패

- 발생일: 2026-07-15
- 상태: 원인 확인, 후속 실행 정상
- 영향: 공개 저장소 생성 직후 첫 CI에서 build는 통과했지만 secret-scan job이 실패했다.

## 기대와 실제

gitleaks가 공개된 모든 커밋을 검사해야 했다. 실제로는 action이 첫 push 범위를 `최초 커밋의 부모..현재 커밋`으로 구성했고, root commit에는 부모가 없어 Git이 unknown revision을 반환했다. secret 발견으로 실패한 것은 아니며 해당 실행은 0바이트 부분 검사로 끝났다.

## 증거와 원인

실패 로그에서 gitleaks가 root commit 부모를 포함한 revision range를 전달한 직후 `ambiguous argument`로 종료한 것을 확인했다. `fetch-depth: 0`은 이미 설정되어 있어 shallow clone 문제가 아니었다.

## 처리와 검증

후속 커밋 push에서는 유효한 이전 commit이 생겨 동일 workflow의 build와 secret-scan이 모두 성공했다. 로컬에서도 전체 Git 기록과 staged diff를 gitleaks로 각각 검사해 노출 0건을 확인했다.

이 문제는 저장소 최초 push에서만 발생하는 action의 범위 계산 경계 사례다. 현재 저장소에는 정상적인 부모 commit이 있으므로 설정을 우회하거나 검사를 약화하지 않는다. 앞으로 workflow를 새 저장소 템플릿으로 재사용할 때 root commit 전용 실행을 별도로 검토한다.
