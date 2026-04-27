# Project Tiny-Cats 🐱

## 프로젝트 개요

귀엽고 포근한 2D 픽셀 고양이 시뮬레이션 게임.
사용자가 배치한 가구 위에서 고양이들이 노닐고, 서로 야옹거리는 힐링 게임.

---

## 폴더 구조

```
F:/Project_Tiny-Cats/
├── data/
│   ├── config.json       ← 전역 설정 (화면크기, FPS, 오디오 경로 등)
│   ├── cats.json         ← 고양이 10종 정적 정의 (읽기 전용)
│   ├── furniture.json    ← 가구 6종 정적 정의 (읽기 전용)
│   └── state.json        ← 런타임 상태 (저장/불러오기 대상)
├── assets/
│   ├── sprites/          ← 스프라이트시트 PNG (추후 추가)
│   └── sounds/           ← 효과음 MP3 (추후 추가)
└── src/                  ← 게임 소스코드 (추후 추가)
```

---

## 데이터 파일 설명

### config.json — 전역 설정
- 캔버스 크기: 800 x 600
- 스프라이트 기본 크기: 64 x 64px
- FPS: 12
- 오디오 기본 경로: `assets/sounds/`

### cats.json — 고양이 10종 정적 정의
게임에 등장하는 고양이 종류별 데이터. 절대 런타임에서 수정하지 않음.

| ID | 종류 | 한국명 | 속도 | 성격 |
|----|------|--------|------|------|
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

**스프라이트 구조** — 스프라이트시트 기준 row 번호로 관리 (인덱스 충돌 방지)
```
row 0 → 치즈 태비   [idle:0] [walk:1,2,3,4] [interact:5]
row 1 → 고등어 태비 [idle:0] [walk:1,2,3,4] [interact:5]
...
row 9 → 크림        [idle:0] [walk:1,2,3,4] [interact:5]
```

### furniture.json — 가구 6종 정적 정의

| ID | 종류 | 한국명 | 최대 고양이 수 | 해금 레벨 |
|----|------|--------|--------------|-----------|
| f01 | Cat Tree | 캣타워 | 3 | Lv.1 |
| f02 | Cat Bed | 고양이 침대 | 2 | Lv.1 |
| f03 | Window Perch | 창가 해먹 | 1 | Lv.2 |
| f04 | Cardboard Box | 박스 | 1 | Lv.1 |
| f05 | Sunny Spot | 햇살 자리 | 2 | Lv.1 |
| f06 | Bookshelf | 책장 | 2 | Lv.3 |

**슬롯 시스템** — 각 가구마다 고양이가 앉을 수 있는 슬롯 위치 정의
```json
"slots": [
  { "slot_id": 0, "offset": { "x": 0, "y": -48 }, "action": "sit" }
]
```

**allowed_traits** — 성격이 맞는 고양이만 해당 가구 사용 가능
- 캣타워: playful, energetic, agile, curious
- 고양이 침대: lazy, sweet, calm, gentle, affectionate
- 박스: shy, mysterious, independent

### state.json — 런타임 상태 (저장 파일)
게임 실행 중 변하는 모든 데이터. 세이브/로드 대상은 이 파일만.

```
player      → 레벨, 코인, 플레이 시간
world       → 활성 고양이 목록, 배치된 가구 목록 + 위치
cats_runtime → 고양이별 현재 위치, 행동, 프레임, 허기/행복/에너지
```

---

## 핵심 설계 원칙

### 1. 정적 데이터 vs 런타임 상태 분리
```
cats.json / furniture.json  →  절대 수정 안 함 (읽기 전용 마스터 데이터)
state.json                  →  게임 중 계속 갱신, 저장/불러오기 대상
```

### 2. 스프라이트 인덱스 자동 계산
```js
// 수동 인덱스 관리 대신 row 기반 자동 계산
const frameX = (frameIndex % columns) * frameWidth;
const frameY = cat.sprite.row * frameHeight;
```

### 3. 성격(traits) 기반 AI 행동
고양이의 `traits`와 가구의 `allowed_traits`를 매칭해서
어떤 가구로 이동할지 자동 결정.

```js
const canUse = furniture.interaction.allowed_traits
  .some(t => cat.traits.includes(t));
```

### 4. 슬롯 점유 시스템
가구마다 슬롯이 있고, 고양이가 점유하면 `occupied_slots`에 기록.
`max_cats` 초과 시 다른 고양이는 해당 가구 사용 불가.

---

## 다음 작업 목록 (TODO)

- [ ] `src/` 폴더 구조 설계 (게임 루프, 렌더러, AI 등)
- [ ] Canvas 기반 게임 루프 구현
- [ ] 스프라이트 렌더러 구현
- [ ] 고양이 AI (wandering, furniture 선택 로직)
- [ ] 픽셀아트 에셋 제작 (Midjourney 또는 Aseprite)
- [ ] 가구 배치 UI
- [ ] 저장/불러오기 시스템

---

## 개발 환경

- **에디터**: VS Code
- **언어**: JavaScript (Vanilla) 또는 TypeScript 예정
- **렌더링**: HTML5 Canvas
- **버전관리**: Git 예정
- **에셋 툴**: Aseprite / Midjourney

---

*Claude와 대화 이력 기반으로 작성된 문서 — 2026-04-24*
