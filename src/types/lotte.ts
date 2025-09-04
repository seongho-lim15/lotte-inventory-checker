// 롯데마트 API 관련 타입 정의

export interface Store {
  code: string;
  name: string;
  region: string;
}

export interface Product {
  name: string;
  size: string;
  manufacturer: string;
  price: number;
  stock: number;
  store: Store;
}

export interface SearchResult {
  region: string;
  storeName: string;
  products: Product[];
}

export interface RegionGroup {
  region: string;
  stores: {
    storeName: string;
    products: Product[];
    availableCount: number; // 재고 있는 상품 수
    totalCount: number; // 전체 상품 수
  }[];
}

// 롯데마트 지역 목록
export const REGIONS = [
  '서울', '경기', '인천', '강원', '충북', '충남', '대전', 
  '경북', '경남', '대구', '부산', '울산', '전북', '전남', '광주', '제주'
] as const;

export type Region = typeof REGIONS[number];
