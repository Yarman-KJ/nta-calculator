# NTA 작전수첩

실제 작업 기준은 이 저장소입니다. 공개 화면은 기존 `index.html`이며, 개발 코드와 현행 데이터를 분리했습니다.

- `references/`: NTA 통합 소스 V6 원문과 SHA-256 보존 기록
- [주제별 소스 찾아보기](knowledge/README.md): V6 전체를 51개 파일로 나눈 읽기용 자료. 장비·전투·보스·파밍·병종·영웅·정책과 과거 버전·원문 부록을 구별합니다.
- `data/current/`: 현행 실행 데이터와 출처·확정 수준 기록
- `src/`: 배포본에서 복원한 코드와 HTML 템플릿
- `AGENTS.md`, `docs/WORKFLOW.md`: 공통 작업지침과 패치 5단계
- `tests/`: 기존 회귀 테스트와 원문 보존·빌드 일치 검사

Node.js 24에서 `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm run check:build`로 검증합니다. 편집 후 `pnpm run build`로 HTML을 생성합니다. 이 명령은 공개 배포하지 않습니다. 세부 범위와 미확인은 [작업지침](docs/WORKFLOW.md)을 확인하세요.
