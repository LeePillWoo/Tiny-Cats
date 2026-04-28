# Tiny Cats 🐱

귀엽고 포근한 2D 픽셀 고양이 시뮬레이션 게임.
사용자가 배치한 가구 위에서 고양이들이 노닐고, 서로 교류하는 힐링 게임.

**▶ 라이브 데모:** [leepillwoo.github.io/Tiny-Cats](https://leepillwoo.github.io/Tiny-Cats/)

---

## 실행 방법

### GitHub Pages (서버 불필요)

위 링크에서 바로 플레이 가능합니다.

### 로컬 실행

```bash
node server.js
# → http://localhost:3000
```

또는 `서버시작.bat` 더블클릭.
(`file://` 프로토콜은 ES 모듈 + fetch 제한으로 작동하지 않습니다.)

---

## 게임 플레이

- 시작 시 고양이 3마리 자동 등장
- **고양이 추가 +** 버튼으로 최대 10마리까지 추가 가능
- 고양이들은 AI에 의해 자율적으로 행동 (배고프면 밥그릇, 피곤하면 침대 등)
- 고양이끼리 근처에 있으면 놀거나 싸우기도 함

---

## 폴더 구조

```text
Tiny-Cats/
├── index.html              ← 진입점 (GitHub Pages / 로컬 공용)
├── server.js               ← 로컬 개발용 Node.js 서버
├── src/
│   ├── main.js             ← 초기화, 게임 루프, 에셋 로딩
│   ├── Cat.js              ← 고양이 AI, 상태머신, 애니메이션
│   ├── World.js            ← 월드 관리, 고양이/가구 쿼리
│   ├── Renderer.js         ← Canvas 2D 렌더링
│   ├── Furniture.js        ← 가구 메타데이터, 슬롯 점유 관리
│   └── utils.js            ← rand, clamp, lerp 유틸
├── data/
│   ├── cats.json           ← 고양이 10종 정적 정의
│   ├── furniture.json      ← 가구 6종 정적 정의
│   ├── config.json         ← 전역 설정
│   └── state.json          ← 런타임 상태 (저장/불러오기 예정)
└── assets/sprites/
    ├── cats/               ← 고양이 PNG 10종
    └── furniture/          ← 가구 PNG 6종
```

---

## 고양이 10종

| ID | 종류 | 이름 | 속도 | 성격 |
| -- | ---- | ---- | ---- | ---- |
| 1 | Orange Tabby | 치즈 태비 | 1.5 | playful, energetic |
| 2 | Silver Tabby | 고등어 태비 | 1.2 | curious, calm |
| 3 | Tuxedo | 턱시도 | 1.8 | shy, fast |
| 4 | Calico | 삼색이 | 1.0 | affectionate, slow |
| 5 | Tortoiseshell | 카오스 | 1.3 | unpredictable, independent |
| 6 | All Black | 올블랙 | 1.6 | mysterious, agile |
| 7 | All White | 올화이트 | 1.1 | elegant, gentle |
| 8 | Siamese | 샴 | 1.4 | vocal, social |
| 9 | Russian Blue | 러시안 블루 | 1.3 | reserved, loyal |
| 10 | Cream | 크림 | 1.0 | lazy, sweet |

---

## 가구 6종

| 가구 | 한국명 | 최대 고양이 | 이용 성격 |
| ---- | ------ | ---------- | --------- |
| Cat Tree | 캣타워 | 2 | playful, energetic, agile, curious |
| Plush Pet Bed | 방석 | 1 | lazy, sweet, calm, gentle, affectionate |
| Scratching Post | 스크래처 | 1 | playful, energetic, curious, agile, independent |
| Food & Water Stand | 밥그릇 | 1 | 모든 고양이 |
| Cat House | 고양이집 | 1 | shy, mysterious, independent, reserved |
| Armchair | 안락의자 | 2 | elegant, gentle, calm, loyal, social, vocal, affectionate |

---

## 고양이 AI 상태머신

```text
IDLE ──→ WALK/RUN ──→ (가구 도착) ──→ SIT / SLEEP / EAT / SCRATCH
  ↑          │
  └──────────┘ (배회 후 복귀)

IDLE ──→ (근처 고양이 감지) ──→ PLAY / FIGHT
SLEEP ──→ STRETCH ──→ IDLE
```

**의사결정 우선순위:**

1. 배고픔 < 28 → 밥그릇으로 이동
2. 에너지 < 22 → 수면 가구로 이동
3. 근처 한가한 고양이 → 30% 확률로 상호작용
4. 랜덤 행동 (그루밍, 스트레칭, 가구 이용, 배회, 대기)

---

## 기술 스택

- **언어**: JavaScript (Vanilla ES Modules)
- **렌더링**: HTML5 Canvas 2D
- **서버**: Node.js (로컬 전용, 프로덕션 불필요)
- **호스팅**: GitHub Pages
- **에셋**: 픽셀아트 PNG

---

## 향후 계획

- [ ] 저장/불러오기 (localStorage)
- [ ] 가구 직접 배치 UI
- [ ] 고양이 행복도 / 통계 표시
- [ ] 효과음 (meow, purr)
- [ ] 추가 가구 / 이벤트

---

*2026-04-27*
