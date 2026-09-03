# 깃허브(GitHub Pages) 배포 안내 가이드

이 프로젝트는 깃허브(GitHub) 저장소에 코드를 올리면 **GitHub Pages를 통해 웹 사이트로 자동 배포 및 서비스**될 수 있도록 모든 설정이 완료되어 있습니다.

---

## 1. 깃허브 저장소 설정 (최초 1회만 설정)

깃허브 저장소에서 GitHub Actions를 이용한 자동 배포를 활성화해야 합니다.

1. 본인의 **GitHub 저장소** 페이지로 이동합니다.
2. 상단 메뉴에서 **Settings** (설정) 탭을 클릭합니다.
3. 좌측 사이드바에서 **Pages** 메뉴를 선택합니다.
4. **Build and deployment** 항목의 **Source**를 `Deploy from a branch`에서 **`GitHub Actions`** 로 변경합니다.
   *(이 설정만 해두시면 앞으로 `main` 브랜치에 코드를 푸시할 때마다 자동으로 빌드되고 배포됩니다.)*

---

## 2. 코드 푸시하여 자동 배포하기

터미널에서 아래 명령어로 커밋 후 푸시하면 GitHub Actions가 즉시 실행되어 사이트가 배포됩니다:

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

- 푸시 후 저장소 상단의 **Actions** 탭에서 `Deploy to GitHub Pages` 워크플로우 진행 상황을 실시간으로 확인하실 수 있습니다.
- 배포가 완료되면 `https://<깃허브계정명>.github.io/<저장소명>/` 주소로 즉시 서비스됩니다.

---

## 3. 적용된 설정 요약

- **상대 경로 에셋 지원 (`vite.config.ts`)**: `base: './'`를 적용하여 깃허브 저장소 서브디렉터리(`username.github.io/repo-name/`) 환경에서도 모든 CSS/JS/폰트가 404 에러 없이 로드됩니다.
- **GitHub Actions 워크플로우 (`.github/workflows/deploy.yml`)**: `main` 또는 `master` 브랜치에 푸시될 때마다 자동으로 Node.js 환경에서 최신 소스를 빌드하고 Pages에 배포합니다.
- **수동 배포 스크립트 (`package.json`)**: 필요시 터미널에서 `npm run deploy` 명령어를 통해서도 배포할 수 있도록 `gh-pages` 설정이 추가되어 있습니다.
- **SPA 404 리디렉션 처리 (`public/404.html`)**: 새로고침 시 404 오류가 발생하는 것을 방지하도록 구성되었습니다.
