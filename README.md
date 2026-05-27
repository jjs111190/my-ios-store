# Private iOS SideStore App Deployment Server

이 프로젝트는 Apple Developer 개발 계정(연 $99)이나 TestFlight, App Store Connect 없이 **GitHub Pages 정적 호스팅**으로 개인 iOS IPA 배포 페이지를 운영하기 위한 패키지입니다.

Mac에서 서버를 직접 열 필요 없이 GitHub 저장소에 파일을 push하면 GitHub Pages에서 앱 목록과 IPA 다운로드를 제공합니다.

로그인은 테스트용 클라이언트 잠금입니다. 기본 계정은 `admin / admin8579`입니다. 정적 사이트 특성상 링크를 아는 사용자는 파일 URL에 직접 접근할 수 있으므로, 실제 보안이 필요한 배포에는 서버 인증 또는 비공개 스토리지를 사용해야 합니다.

---

## 🚀 빠른 실행 순서 (Quick Start)

배포 서버를 작동시키는 전체 흐름입니다. 상세 설정 전에 이 순서대로 터미널 명령어를 입력하면 즉시 실행할 수 있습니다.

1. **IPA 파일 배치**: 배포할 `.ipa` 파일들을 `ipas/` 폴더에 넣습니다. (파일명 매칭: `SnapMoment.ipa`, `RecordFlow.ipa` 등)
2. **아이콘 파일 배치**: 앱 아이콘 이미지들을 `icons/` 폴더에 넣습니다. (파일명 매칭: `snapmoment.png` 등, 미설정 시 기본 아이콘 사용)
3. **NPM 패키지 설치**:
   ```bash
   npm install
   ```
4. **GitHub Pages 주소 설정**:
   ```bash
   npm run prepare:github -- https://GITHUB_USER.github.io/REPOSITORY_NAME
   ```
   현재 기본값은 `https://jjs111190.github.io/my-ios-store`입니다.
5. **SideStore 소스 파일 생성**:
   ```bash
   npm run generate
   ```
6. **GitHub에 push**:
   ```bash
   git add .
   git commit -m "Update iOS app store"
   git push
   ```
7. GitHub repository 설정에서 **Pages > Build and deployment > GitHub Actions**를 선택합니다.
8. iPhone Safari에서 GitHub Pages 주소로 접속 후 `admin / admin8579`로 로그인합니다.
9. 웹사이트에서 **"SideStore 소스 추가"** 또는 **"SideStore 설치"** 버튼을 사용합니다.

> 정적 로그인 계정은 `admin / admin8579`입니다. 이 값은 테스트용 UI 잠금이며 실제 파일 접근 보안은 아닙니다.

---

## 📱 SideStore 정확한 사용 가이드

웹사이트에서 앱을 설치하려면 iPhone에 **SideStore**가 먼저 설치되고 첫 Refresh까지 완료되어 있어야 합니다. 현재 공식 흐름은 `iloader + LocalDevVPN` 기준입니다.

공식 문서:

- [SideStore 설치 전 준비](https://docs.sidestore.io/ko/docs/installation/prerequisites)
- [SideStore 설치](https://docs.sidestore.io/ko/docs/installation/install)
- [SideStore 문제 해결](https://docs.sidestore.io/docs/troubleshooting/common-issues)

### 1단계: 처음 1번만 Mac에서 SideStore 설치

1. iPhone에 비밀번호가 설정되어 있고 iOS/iPadOS 15 이상인지 확인합니다.
2. iPhone에서 App Store의 **LocalDevVPN**을 설치하고 한 번 열어 VPN 추가를 허용합니다.
3. Mac에 **iloader**를 설치합니다.
4. iPhone을 USB 케이블로 Mac에 연결하고, iPhone에 **이 컴퓨터를 신뢰**가 뜨면 신뢰를 누릅니다.
5. Mac에서 iloader를 열고 Apple ID로 로그인합니다.
6. 2단계 인증이 뜨면 iPhone에 표시된 6자리 인증 코드를 iloader에 입력합니다.
7. iloader에서 연결된 iPhone을 선택하고 **Install SideStore (Stable)**을 실행합니다.

### 2단계: iPhone에서 SideStore 활성화

1. `설정 > 일반 > VPN 및 기기 관리`에서 Apple ID 개발자 앱을 선택하고 **신뢰**를 누릅니다.
2. iOS 16 이상이면 `설정 > 개인정보 보호 및 보안 > 개발자 모드`를 켠 뒤 iPhone을 재시동합니다.
3. LocalDevVPN을 열고 **Connect**를 눌러 VPN을 켭니다.
4. SideStore를 열고 iloader에서 사용한 Apple ID로 로그인합니다.
5. `My Apps` 탭에서 SideStore 오른쪽의 **7 DAYS**를 눌러 첫 Refresh를 완료합니다.
6. 인증서를 새로 만들거나 취소하라는 안내가 뜨면 **Yes** 또는 **Refresh Now**를 선택합니다.

### 3단계: 이 스토어 소스 추가

1. iPhone Safari에서 GitHub Pages 주소를 엽니다.
   ```text
   https://jjs111190.github.io/my-ios-store/
   ```
2. 웹사이트 로그인에 아래 값을 입력합니다.
   ```text
   아이디: admin
   비밀번호: admin8579
   ```
3. 웹사이트 상단의 **SideStore에 소스 추가하기** 버튼을 누릅니다.
4. 버튼이 동작하지 않으면 SideStore의 `Sources` 탭에서 **+**를 누르고 아래 주소를 직접 붙여넣습니다.
   ```text
   https://jjs111190.github.io/my-ios-store/apps.json
   ```

### 4단계: 앱 설치

1. iPhone에서 LocalDevVPN이 켜져 있는지 확인합니다.
2. 웹사이트 앱 카드의 **SideStore 설치** 버튼을 누르거나, SideStore의 `Sources` 탭에서 앱을 선택합니다.
3. SideStore로 화면이 넘어가면 **Install**을 눌러 설치를 승인합니다.
4. 홈 화면에 앱이 생기면 실행합니다.

### 5단계: 7일 만료 관리

1. 무료 Apple ID로 설치한 앱은 보통 7일마다 Refresh가 필요합니다.
2. 만료 전에 LocalDevVPN을 켭니다.
3. `SideStore > My Apps > Refresh All`을 누릅니다.
4. SideStore 자체가 만료되어 열리지 않으면 Mac에서 iloader로 SideStore를 다시 설치합니다.

### 6단계: 오류 해결 순서

- **No Wi-Fi or VPN**: Wi-Fi와 LocalDevVPN이 모두 켜져 있는지 확인하고 SideStore와 LocalDevVPN을 재시작합니다.
- **소스 추가 실패**: Safari에서 열었는지, SideStore가 설치되어 있는지, 소스 주소가 `https://`로 시작하는지 확인합니다.
- **설치 실패**: SideStore 로그인, LocalDevVPN 연결, 남은 앱 슬롯, 7일 만료 여부를 확인합니다.
- **앱 실행 불가**: Refresh가 만료된 상태일 수 있습니다. SideStore가 열리면 Refresh All, 열리지 않으면 iloader로 SideStore를 재설치합니다.
- **iPhone 업데이트 후 실패**: 페어링이 깨졌을 수 있으므로 iloader에서 pairing file을 다시 등록합니다.

---

## 🖥️ GitHub Pages 배포 및 관리 방법

### 1. GitHub Pages 정적 배포
이 프로젝트는 GitHub Pages에 그대로 올리는 정적 사이트입니다.

- `index.html`: 로그인 화면과 앱 목록 UI
- `apps.json`: SideStore/AltStore 소스 파일
- `ipas/`: 다운로드할 IPA 파일
- `icons/`: 앱 아이콘
- `.github/workflows/pages.yml`: GitHub Pages 자동 배포

GitHub Pages 주소가 바뀌면 아래 명령으로 모든 다운로드 URL을 갱신합니다.

```bash
npm run prepare:github -- https://GITHUB_USER.github.io/REPOSITORY_NAME
```

### 2. 로컬 미리보기 (`serve:public`)
GitHub에 push하기 전에 브라우저에서 확인할 때 사용합니다.

- **실행 방법**:
  ```bash
  npm run serve:public
  ```

### 3. URL 정보 일괄 업데이트 (`update-base-url.mjs`)
GitHub Pages 주소가 바뀌었을 때 사용합니다.

```bash
npm run update-url https://GITHUB_USER.github.io/REPOSITORY_NAME
```

이 스크립트는 `apps.config.json`의 `baseURL`을 변경하고 `apps.json`을 다시 생성합니다.

---

## 🛠️ 앱 추가 및 메타데이터 수정 방법

새로운 앱을 배포 시스템에 추가하려면 다음 과정을 따릅니다.

1. `.ipa` 파일을 빌드하거나 구해서 `ipas/` 폴더에 저장합니다.
2. `apps.config.json` 파일을 편집기로 엽니다.
3. `apps` 배열 내부에 새로운 앱 오브젝트를 정의합니다:
   ```json
   {
     "name": "MyNewApp",
     "bundleIdentifier": "com.jaeseok.mynewapp",
     "ipa": "ipas/MyNewApp.ipa",
     "icon": "icons/mynewapp.png",
     "version": "1.0.0",
     "buildVersion": "1",
     "subtitle": "앱 한줄 요약",
     "description": "앱 상세 설명"
   }
   ```
4. `icons/` 폴더에 `mynewapp.png` 이미지를 넣습니다. (없을 경우 자동으로 `icons/default.png`가 적용됩니다.)
5. 터미널에서 다음 명령을 실행하여 `apps.json`을 새로 빌드합니다:
   ```bash
   npm run generate
   ```
6. GitHub에 commit/push하면 Pages가 자동 배포합니다.

### 현재 포함된 IPA

현재 설치 가능한 IPA는 다음 4개입니다.

- `SnapMoment`: `ipas/SnapMoment.ipa`
- `RecordFlow`: `ipas/RecordFlow.ipa`
- `NeoMini`: `ipas/NeoMini.ipa`
- `FlowWorks`: `ipas/FlowWorks.ipa`

`Aura.ipa`, `Cutory.ipa`는 현재 0바이트 파일이라 SideStore 소스에서 자동 제외됩니다. 각 프로젝트에서 실제 `Release-iphoneos` 또는 `Debug-iphoneos` 앱 번들을 만든 뒤 `scripts/package-app.mjs`로 다시 패키징하면 목록에 포함됩니다.

---

## ⏳ 무료 Apple ID 서명 제한 및 7일 Refresh 관리

무료 Apple Developer 계정(개인 Apple ID)을 통해 앱을 사이드로딩할 때는 Apple의 정책으로 인해 다음과 같은 한계가 존재합니다.

- **7일 유효기간**: 설치된 모든 사이드로딩 앱은 서명 후 **7일이 지나면 실행이 불가능**해집니다.
- **자동/수동 갱신(Refresh)**:
  - 기기에 설치된 **SideStore** 앱은 백그라운드나 수동 실행 시 자동으로 인증서를 재서명하여 앱 수명을 계속 늘려줍니다.
  - 7일이 만료되기 전에 주기적으로 iPhone에서 SideStore 앱을 열고 `Refresh All`을 터치하거나, 홈 화면 위젯을 활용해 백그라운드 자동 서명이 활성화되도록 유도하십시오.
  - 서명 갱신 시에는 반드시 **LocalDevVPN 또는 SideStore용 VPN** 프로필이 켜져 있어야 합니다.

---

## 🔒 보안 및 이용 규칙

1. **정적 로그인 한계**: GitHub Pages는 정적 호스팅이므로 `admin / admin8579` 로그인은 화면 잠금입니다. 앱 파일 URL을 아는 사용자는 직접 다운로드할 수 있습니다.
2. **크레덴셜 노출 방지**: 본 템플릿의 소스 코드에는 Apple ID 비밀번호나 앱 전용 암호를 절대로 저장하지 마십시오. SideStore 기기 내 로그인은 서버에 저장될 이유가 없습니다.
3. **비상업적 목적 명시**: 이 저장소는 순수 개인 목적의 개발 및 테스트 용도로만 사용해야 합니다.

---

## ❓ 자주 발생하는 오류 해결 (Troubleshooting)

### Q1. iPhone Safari에서 웹페이지 접속은 되는데 "SideStore 설치"를 눌러도 반응이 없거나 에러가 납니다.
> **A**: SideStore 앱이 기기에 없거나 페어링 설정이 완료되지 않은 상태입니다. 반드시 상단의 **[SideStore 아이폰 사전 설치 및 설정 가이드]**에 따라 설치와 로그인을 먼저 마쳐주십시오.

### Q2. `npm run generate` 실행 시 특정 앱이 생략되었다고 나옵니다.
> **A**: `ipas/` 폴더 내에 `apps.config.json`에 정의한 `ipa` 경로에 부합하는 파일이 실제로 없는 경우입니다. 대소문자나 파일명 매칭을 확인해 보십시오. (이 서버는 없는 IPA 파일은 빌드에서 제외하고 경고를 출력합니다.)

### Q3. GitHub Pages 주소를 바꿨는데 앱 다운로드가 이전 주소로 연결됩니다.
> **A**: `npm run prepare:github -- https://GITHUB_USER.github.io/REPOSITORY_NAME`을 실행한 뒤 `apps.json`까지 commit/push했는지 확인하십시오.

### Q4. 7일이 지나 앱 실행 시 크래시(튕김)가 발생합니다.
> **A**: 서명 유효기간 7일이 만료된 상태입니다. iPhone에서 LocalDevVPN 또는 SideStore용 VPN을 켜고 SideStore 앱에 진입하여 `Refresh All`을 진행해 주면 다시 정상적으로 앱이 작동합니다. 만약 SideStore 앱마저 실행이 되지 않는다면, 컴퓨터에 연결 후 AltServer를 통해 SideStore를 재설치해주어야 합니다.
