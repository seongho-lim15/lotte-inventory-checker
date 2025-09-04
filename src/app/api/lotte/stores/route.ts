import { NextRequest, NextResponse } from 'next/server';
import { Store, Region } from '@/types/lotte';

// 매장명을 정확한 공식 명칭으로 변환하는 함수
const normalizeStoreName = (originalName: string, storeCode: string): string => {
  // 이미 정확한 매장명이 있는 경우 그대로 사용
  if (originalName.includes('토이저러스') || originalName.includes('그랑그로서리')) {
    return originalName;
  }
  
  // search/route.ts와 동일한 매장 코드 매핑 (실제 API 확인된 매장 코드)
  const storeNameMap: Record<string, string> = {
    // ===== 실제 API에서 확인된 매장 코드들 =====
    
    // 서울 지역 (API 확인완료)
    '326': '토이저러스 제타플렉스',
    '344': '토이저러스 양평점', 
    '342': '그랑그로서리 은평점',
    '343': '토이저러스 은평점',
    '339': '토이저러스 중계점',
    '302': '제타플렉스 잠실점',
    '301': '강변점',
    '335': '금천점',
    '441': '김포공항점',
    '316': '삼양점',
    '200': '제타플렉스 서울역점',
    '340': '서초점',
    '322': '송파점',
    '328': '양평점',
    '334': '월드타워점',
    '307': '중계점',
    '312': '청량리점',
    '323': '행당역점',
    '303': '천호점',
    
    // 경기 지역 (API 확인완료)
    '405': '그랑그로서리 구리점',
    '448': '토이저러스 롯데몰수지점',
    '416': '토이저러스 광명점',
    '489': '토이저러스 광교점',
    '492': '토이저러스 이천점',
    '496': '토이저러스 기흥점',
    '497': '토이저러스 파주점',
    '473': '경기양평점',
    '455': '고양점',
    '463': '광교점',
    '458': '권선점',
    '479': '김포한강점',
    '457': '덕소점',
    '435': '동두천점',
    '446': '롯데몰수지점',
    '453': '마석점',
    '464': '상록점',
    '475': '선부점',
    '462': '수원점',
    '456': '시화점',
    '476': '시흥배곧점',
    '459': '시흥점',
    '468': '신갈점',
    '415': '안산점',
    '417': '안성점',
    '410': '오산점',
    '409': '의왕점',
    '422': '이천점',
    '430': '장암점',
    '403': '주엽점',
    '411': '천천점',
    '471': '판교점',
    '408': '화정점',
    
    // 인천 지역 (API 확인완료)
    '433': '검단점',
    '469': '계양점',
    '404': '부평역점',
    '426': '부평점',
    '418': '삼산점',
    '465': '송도점',
    '406': '연수점',
    '461': '청라점',
  };
  
  // 매장 코드에 해당하는 정확한 매장명이 있으면 사용
  if (storeNameMap[storeCode]) {
    return storeNameMap[storeCode];
  }
  
  // 매장명에서 "점" 제거하고 지역명 + "롯데마트" 형태로 변환
  let normalizedName = originalName.replace(/점$/, '').trim();
  
  // 이미 "롯데마트"가 포함되어 있지 않으면 추가
  if (!normalizedName.includes('롯데마트')) {
    normalizedName = normalizedName + ' 롯데마트';
  }
  
  return normalizedName;
};

// HTML에서 매장 목록을 파싱하는 함수
const parseStoreListFromHtml = (html: string, region: Region): Store[] => {
  const stores: Store[] = [];
  
  try {
    // option 태그에서 매장 정보를 추출 (value와 텍스트)
    const optionRegex = /<option\s+value="([^"]+)"[^>]*>([^<]+)<\/option>/gi;
    let match;
    
    while ((match = optionRegex.exec(html)) !== null) {
      const storeCode = match[1].trim();
      const storeName = match[2].trim();
      
      // 첫 번째 옵션("매장선택")은 제외
      if (storeCode && storeName && storeName !== '매장선택') {
        // 매장명을 정확하게 변환 (롯데마트 공식 매장명으로)
        const normalizedStoreName = normalizeStoreName(storeName, storeCode);
        
        stores.push({
          code: storeCode,
          name: normalizedStoreName,
          region,
        });
      }
    }
  } catch (error) {
    console.error('HTML 파싱 오류:', error);
  }
  
  return stores;
};

// 토이저러스와 그랑그로서리 매장만 포함한 Mock 데이터 (서울, 경기만)
const getMockStores = (region: Region): Store[] => {
  const storeMap: Partial<Record<Region, Store[]>> = {
    '서울': [
      { code: '326', name: '토이저러스 제타플렉스', region: '서울' },
      { code: '344', name: '토이저러스 양평점', region: '서울' },
      { code: '342', name: '그랑그로서리 은평점', region: '서울' },
      { code: '343', name: '토이저러스 은평점', region: '서울' },
      { code: '339', name: '토이저러스 중계점', region: '서울' },
      { code: '302', name: '제타플렉스 잠실점', region: '서울' },
      { code: '200', name: '제타플렉스 서울역점', region: '서울' },
    ],
    '경기': [
      { code: '405', name: '그랑그로서리 구리점', region: '경기' },
      { code: '448', name: '토이저러스 롯데몰수지점', region: '경기' },
      { code: '416', name: '토이저러스 광명점', region: '경기' },
      { code: '489', name: '토이저러스 광교점', region: '경기' },
      { code: '492', name: '토이저러스 이천점', region: '경기' },
      { code: '496', name: '토이저러스 기흥점', region: '경기' },
      { code: '497', name: '토이저러스 파주점', region: '경기' },
    ],
    // 인천 제외, 서울/경기만 지원
  };

  return storeMap[region] || [];
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get('region') as Region;

  if (!region) {
    return NextResponse.json({ error: '지역을 지정해주세요' }, { status: 400 });
  }

  try {
    // 실제 롯데마트 API 호출
    const response = await fetch(
      `https://company.lottemart.com/mobiledowa/inc/asp/search_market_list.asp?p_area=${encodeURIComponent(region)}&p_type=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://company.lottemart.com/mobiledowa/',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const html = await response.text();
    const allStores = parseStoreListFromHtml(html, region);
    
    // 토이저러스, 그랑그로서리 매장만 필터링
    const filteredStores = allStores.filter(store => 
      store.name.includes('토이저러스') || store.name.includes('그랑그로서리')
    );

    console.log(`${region} 지역: 전체 ${allStores.length}개 매장 중 ${filteredStores.length}개 매장(토이저러스/그랑그로서리) 반환`);
    return NextResponse.json(filteredStores);
    
  } catch (error) {
    console.error('매장 목록 조회 오류:', error);
    
    // API 실패시 백업으로 Mock 데이터 사용
    const mockStores = getMockStores(region);
    
    // Mock 데이터에서도 토이저러스, 그랑그로서리만 필터링
    const filteredMockStores = mockStores.filter(store => 
      store.name.includes('토이저러스') || store.name.includes('그랑그로서리')
    );
    
    console.log(`API 실패, Mock 데이터 사용: ${region} 지역 ${filteredMockStores.length}개 매장(토이저러스/그랑그로서리)`);
    return NextResponse.json(filteredMockStores);
  }
}
