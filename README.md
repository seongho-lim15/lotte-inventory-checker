# 🛒 롯데마트 재고 확인 서비스

전국 롯데마트 매장의 상품 재고를 실시간으로 확인할 수 있는 웹 서비스입니다.

## ✨ 주요 기능

### 🔍 실시간 재고 검색
- 키워드를 입력하여 전국 롯데마트 매장의 상품 재고를 한 번에 확인
- 토이저러스, 그랑그로서리 등 특수 매장 포함

### 📍 지역별 결과 표시
- 서울, 경기, 인천 지역별로 결과를 그룹화하여 표시
- 각 지역의 매장별 재고 수량과 가격 정보 제공

### 📊 상세 정보 제공
- 상품명, 제조사, 가격, 재고 수량
- 매장명과 위치 정보
- 실시간 재고 현황

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **개발 서버 실행**
```bash
npm run dev
```

3. **브라우저에서 확인**
```
http://localhost:3000
```

## 🛠 기술 스택

### Frontend
- **Next.js 15.5.2** - React 풀스택 프레임워크
- **React 19.1.0** - 사용자 인터페이스 라이브러리
- **TypeScript** - 정적 타입 검사
- **TailwindCSS 4.0** - 유틸리티 우선 CSS 프레임워크

### API & Backend
- **Next.js API Routes** - 서버리스 API 엔드포인트
- **Lotte Mart Mobile API** - 실제 롯데마트 모바일 API 연동

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── lotte/
│   │       ├── search/
│   │       │   └── route.ts      # 상품 검색 API
│   │       └── stores/
│   │           └── route.ts      # 매장 목록 API
│   ├── layout.tsx                # 앱 레이아웃
│   ├── page.tsx                  # 홈페이지
│   └── globals.css               # 글로벌 스타일
├── components/
│   ├── InventoryChecker.tsx      # 메인 재고 확인 컴포넌트
│   ├── SearchForm.tsx            # 검색 폼
│   ├── ResultsList.tsx           # 검색 결과 목록
│   └── LoadingSpinner.tsx        # 로딩 스피너
├── lib/
│   └── lotteApi.ts               # 롯데마트 API 유틸리티
└── types/
    └── lotte.ts                  # TypeScript 타입 정의
```

## 🔧 API 엔드포인트

### 매장 목록 조회
```http
GET /api/lotte/stores?region={지역명}
```

**매개변수:**
- `region` (required): 지역명 (서울, 경기, 인천)

**응답 예시:**
```json
[
  {
    "code": "326",
    "name": "토이저러스 제타플렉스",
    "region": "서울"
  }
]
```

### 상품 검색
```http
POST /api/lotte/search
```

**요청 본문:**
```json
{
  "region": "서울",
  "storeCode": "326",
  "keyword": "레고"
}
```

**응답 예시:**
```json
[
  {
    "name": "레고 테크닉 부가티",
    "size": "42개월 이상",
    "manufacturer": "레고",
    "price": 129000,
    "stock": 3,
    "store": {
      "code": "326",
      "name": "토이저러스 제타플렉스",
      "region": "서울"
    }
  }
]
```

## 🎯 사용법

1. **웹사이트 접속**: 브라우저에서 서비스에 접속
2. **상품 검색**: 검색창에 찾고자 하는 상품명이나 키워드 입력
3. **결과 확인**: 지역별로 그룹화된 검색 결과에서 재고가 있는 매장 확인
4. **매장 방문**: 원하는 매장의 재고를 확인하고 방문

## 📱 반응형 디자인

- **모바일 우선** 설계로 모든 디바이스에서 최적화된 경험
- **다크 모드** 지원으로 사용자 환경에 맞는 테마 제공
- **접근성** 기능 구현으로 모든 사용자가 이용 가능

## 🚀 배포

### 프로덕션 빌드
```bash
npm run build
```

### 프로덕션 서버 실행
```bash
npm start
```

### Vercel 배포 (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## ⚠️ 주의사항

- 재고 정보는 실시간 판매 상황에 따라 실제와 다를 수 있습니다
- 롯데마트 공식 API를 사용하므로 서비스 정책에 따라 제한될 수 있습니다
- 현재 서울, 경기, 인천 지역의 매장만 지원합니다

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/new-feature`)
3. 변경사항을 커밋합니다 (`git commit -am 'Add new feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/new-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 문의사항이 있으시면 GitHub Issues를 이용해주세요.