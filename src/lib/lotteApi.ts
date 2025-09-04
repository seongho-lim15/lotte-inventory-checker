import { Store, Product, Region } from '@/types/lotte';

// CORS 문제 해결을 위한 프록시 URL (실제로는 Next.js API 라우트를 사용)
const BASE_URL = '/api/lotte';

/**
 * 특정 지역의 매장 목록을 가져오는 함수
 */
export const fetchStoresByRegion = async (region: Region): Promise<Store[]> => {
  try {
    const response = await fetch(`${BASE_URL}/stores?region=${encodeURIComponent(region)}`);
    if (!response.ok) {
      throw new Error(`매장 목록을 가져오는데 실패했습니다: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`${region} 지역 매장 목록 조회 실패:`, error);
    return [];
  }
};

/**
 * 특정 매장에서 상품을 검색하는 함수
 */
export const searchProductsInStore = async (
  region: Region,
  storeCode: string,
  keyword: string
): Promise<Product[]> => {
  try {
    const response = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        region,
        storeCode,
        keyword,
      }),
    });

    if (!response.ok) {
      throw new Error(`상품 검색에 실패했습니다: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`상품 검색 실패 (${region} - ${storeCode}):`, error);
    return [];
  }
};

/**
 * 모든 지역의 모든 매장에서 상품을 검색하는 함수
 */
export const searchAllStores = async (keyword: string): Promise<Product[]> => {
  if (!keyword.trim()) {
    return [];
  }

  const allProducts: Product[] = [];
  
  // 서울, 경기만 검색 (사용자 요청)
  const targetRegions: Region[] = ['서울', '경기'];
  for (const region of targetRegions) {
    try {
      console.log(`${region} 지역 매장들 검색 중...`);
      
      // 지역별 매장 목록 가져오기
      const stores = await fetchStoresByRegion(region);
      
      // 토이저러스, 그랑그로서리 매장만 필터링
      const filteredStores = stores.filter(store => 
        store.name.includes('토이저러스') || store.name.includes('그랑그로서리')
      );
      
      // 타임아웃 방지를 위해 매장 수 제한 (주요 매장 우선)
      const priorityStores = filteredStores.slice(0, 8); // 지역당 최대 8개 매장
      
      console.log(`${region} 지역: 전체 ${stores.length}개 매장 중 ${filteredStores.length}개 매장(토이저러스/그랑그로서리) 발견, ${priorityStores.length}개 매장 검색 예정`);
      
      // 각 매장에서 상품 검색 (순차 처리)
      for (const store of priorityStores) {
        try {
          console.log(`${region} ${store.name} 검색 중...`);
          const products = await searchProductsInStore(region, store.code, keyword);
          allProducts.push(...products);
          
          // API 부하 방지를 위한 딜레이 (매장마다)
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`${region} ${store.name} 검색 실패:`, error);
        }
      }

      // 지역 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`${region} 지역 검색 중 오류:`, error);
    }
  }

  return allProducts;
};

/**
 * 상품들을 지역별로 그룹화하고 재고별로 정렬하는 함수
 * 재고가 0개인 상품은 아래로 정렬됩니다.
 */
export const groupProductsByRegion = (products: Product[]) => {
  // 지역별로 그룹화 (모든 상품 포함)
  const regionGroups = new Map<string, Map<string, Product[]>>();
  
  products.forEach(product => {
    const region = product.store.region;
    const storeName = product.store.name;
    
    if (!regionGroups.has(region)) {
      regionGroups.set(region, new Map());
    }
    
    const storeMap = regionGroups.get(region)!;
    if (!storeMap.has(storeName)) {
      storeMap.set(storeName, []);
    }
    
    storeMap.get(storeName)!.push(product);
  });
  
  // Map을 배열로 변환하고 재고별로 정렬
  return Array.from(regionGroups.entries()).map(([region, storeMap]) => ({
    region,
    stores: Array.from(storeMap.entries()).map(([storeName, products]) => {
      // 상품을 재고별로 정렬: 재고가 많은 순 -> 재고가 0개인 상품은 아래로
      const sortedProducts = products.sort((a, b) => {
        // 재고가 0인 상품을 아래로
        if (a.stock === 0 && b.stock > 0) return 1;
        if (a.stock > 0 && b.stock === 0) return -1;
        
        // 둘 다 재고가 있거나 둘 다 재고가 0인 경우, 재고 수량으로 정렬 (내림차순)
        return b.stock - a.stock;
      });
      
      return {
        storeName,
        products: sortedProducts,
        availableCount: products.filter(p => p.stock > 0).length, // 재고 있는 상품 수
        totalCount: products.length, // 전체 상품 수
      };
    }).filter(store => store.totalCount > 0), // 상품이 있는 매장만 포함
  })).filter(regionGroup => regionGroup.stores.length > 0); // 매장이 있는 지역만 포함
};
