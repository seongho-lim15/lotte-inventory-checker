import { Store, Product, Region } from '@/types/lotte';

// CORS 문제 해결을 위한 프록시 URL (Next.js rewrite 사용)
const PROXY_BASE_URL = '/api/proxy/lotte';

// 브라우저 정보 감지 함수
const getBrowserInfo = () => {
  if (typeof window === 'undefined') return { browser: 'server', isMobile: false, connectionType: 'unknown', isSlowConnection: false };
  
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  
  // 연결 타입 감지 (모바일 데이터 vs WiFi)
  let connectionType = 'unknown';
  let isSlowConnection = false;
  
  if ('connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: any }).connection;
    if (connection) {
      connectionType = connection.effectiveType || connection.type || 'unknown';
      // 2g, slow-2g는 느린 연결로 간주
      isSlowConnection = ['slow-2g', '2g'].includes(connection.effectiveType) || connection.downlink < 1.5;
      
      // 모바일 데이터 감지 (connection.type이 'cellular'인 경우)
      if (connection.type === 'cellular' || ['2g', '3g', '4g'].some(type => connectionType.includes(type))) {
        connectionType = 'cellular';
      }
    }
  }
  
  let browser = 'unknown';
  if (isChrome) browser = 'chrome';
  else if (isSafari) browser = 'safari';
  
  console.log(`브라우저 정보: ${browser}, 모바일: ${isMobile}, 연결타입: ${connectionType}, 느린연결: ${isSlowConnection}`);
  
  return { browser, isMobile, connectionType, isSlowConnection, userAgent };
};

// 네트워크 연결 상태에 따른 타임아웃 설정
const getTimeoutForConnection = () => {
  const { isSlowConnection, connectionType, isMobile } = getBrowserInfo();
  
  // 느린 연결이거나 셀룰러(모바일 데이터)인 경우 짧은 타임아웃 사용
  if (isSlowConnection || connectionType === 'cellular') {
    return { store: 15000, product: 20000 }; // 15초, 20초
  }
  
  // 모바일이지만 WiFi인 경우 중간 타임아웃
  if (isMobile) {
    return { store: 20000, product: 25000 }; // 20초, 25초
  }
  
  // PC 환경은 기존 타임아웃 유지
  return { store: 30000, product: 45000 }; // 30초, 45초
};

// 재시도 메커니즘 (지수 백오프)
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> => {
  const { isSlowConnection, connectionType } = getBrowserInfo();
  
  // 느린 연결에서는 재시도 횟수를 줄임
  const retries = (isSlowConnection || connectionType === 'cellular') ? Math.min(maxRetries, 1) : maxRetries;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // 성공한 경우 바로 반환
      if (response.ok) {
        return response;
      }
      
      // 서버 오류 (5xx)인 경우에만 재시도, 클라이언트 오류 (4xx)는 재시도하지 않음
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`클라이언트 오류: ${response.status}`);
      }
      
      // 마지막 시도인 경우 오류 발생
      if (attempt === retries) {
        throw new Error(`서버 오류: ${response.status}`);
      }
      
      console.warn(`시도 ${attempt + 1}/${retries + 1} 실패 (${response.status}), 재시도 중...`);
      
    } catch (error) {
      // 마지막 시도이거나 재시도할 수 없는 오류인 경우
      if (attempt === retries || 
          (error instanceof Error && 
           (error.name === 'AbortError' || error.message.includes('AbortError')))) {
        throw error;
      }
      
      console.warn(`시도 ${attempt + 1}/${retries + 1} 실패:`, error instanceof Error ? error.message : String(error));
    }
    
    // 지수 백오프: 1초, 2초, 4초...
    const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
    console.log(`${delay/1000}초 후 재시도...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  throw new Error('모든 재시도 실패');
};

// 브라우저별 헤더 설정 함수 (디버깅 정보 추가)
const getBrowserHeaders = () => {
  const { browser, isMobile } = getBrowserInfo();
  
  const baseHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  };
  
  // 모바일에서는 기본 헤더만 사용 (이미 잘 작동함)
  if (isMobile) {
    console.log('모바일 환경 - 기본 헤더 사용');
    return baseHeaders;
  }
  
  // PC 환경 - 사파리와 크롬에 따라 다른 User-Agent 사용
  if (browser === 'safari') {
    console.log('PC 사파리 환경 - 사파리 전용 헤더 사용');
    return {
      ...baseHeaders,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://company.lottemart.com/mobiledowa/',
      'Cache-Control': 'no-cache',
    };
  } else {
    console.log('PC 크롬 환경 - 크롬 전용 헤더 사용');
    // 크롬 및 기타 브라우저
    return {
      ...baseHeaders,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://company.lottemart.com/mobiledowa/',
    };
  }
};

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

// 토이저러스와 그랑그로서리 매장만 포함한 Mock 데이터
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
    '인천': [
      { code: '461', name: '청라점', region: '인천' },
      { code: '426', name: '부평점', region: '인천' },
      { code: '404', name: '부평역점', region: '인천' },
    ],
    // API 확인된 지역만 포함, 나머지 지역은 필요시 실제 API 확인 후 추가
  };

  return storeMap[region] || [];
};

/**
 * 특정 지역의 매장 목록을 가져오는 함수
 */
export const fetchStoresByRegion = async (region: Region): Promise<Store[]> => {
  try {
    // 실제 롯데마트 API 호출 (프록시 사용) - 브라우저 호환성 개선
    const timeouts = getTimeoutForConnection();
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeouts.store) : null; // 동적 타임아웃
    
    const fetchOptions: RequestInit = {
      headers: getBrowserHeaders(),
    };
    
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    
    const response = await fetchWithRetry(
      `${PROXY_BASE_URL}/inc/asp/search_market_list.asp?p_area=${encodeURIComponent(region)}&p_type=1`,
      fetchOptions
    );
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const html = await response.text();
    const stores = parseStoreListFromHtml(html, region);

    console.log(`${region} 지역 매장 ${stores.length}개 발견`);
    return stores;
    
  } catch (error) {
    const { browser, isMobile } = getBrowserInfo();
    
    // 타임아웃이나 AbortError 처리
    const timeouts = getTimeoutForConnection();
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] ${region} 지역 매장 목록 조회 타임아웃 (${timeouts.store/1000}초 초과)`);
    } else if (error instanceof Error && error.message.includes('signal')) {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] ${region} 지역 매장 목록 조회 중 중단됨`);
    } else if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] ${region} 지역 네트워크 오류:`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
    } else {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] ${region} 지역 매장 목록 조회 실패:`, {
        error: error instanceof Error ? error.message : String(error),
        type: typeof error,
        name: error instanceof Error ? error.name : 'unknown'
      });
    }
    
    // API 실패시 백업으로 Mock 데이터 사용
    const stores = getMockStores(region);
    console.log(`API 실패, Mock 데이터 사용: ${region} 지역 매장 ${stores.length}개`);
    return stores;
  }
};

// HTML에서 상품 목록을 파싱하는 함수 (실제 롯데마트 API 응답 구조에 맞게 완전히 새로 작성)
const parseProductListFromHtml = (html: string, region: Region, storeCode: string, storeName: string): Product[] => {
  const products: Product[] = [];
  
  try {
    console.log('=== HTML 파싱 시작 ===');
    
    // <li> 태그로 각 상품을 분리
    const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let listItemMatch;
    
    while ((listItemMatch = listItemRegex.exec(html)) !== null) {
      const listItemContent = listItemMatch[1];
      
      // 1. 상품명 추출: <div class="prod-name">상품명</div>
      const productNameMatch = listItemContent.match(/<div[^>]*class="prod-name"[^>]*>([^<]+)<\/div>/i);
      
      if (productNameMatch) {
        const productName = productNameMatch[1].trim();
        console.log(`상품명 발견: ${productName}`);
        
        // 2. 재고 정보 추출: <th>ㆍ재고 : </th><td>80 개</td> 또는 <td>품절</td>
        let stock = 0;
        let price = 0;
        let manufacturer = '';
        let size = '15세이상'; // 기본값
        
        // layer_popup 안의 테이블에서 정보 추출 (중첩된 div 구조 고려)
        let layerContent = '';
        
        // 방법 1: layer_wrap에서 전체 내용 추출
        const layerWrapMatch = listItemContent.match(/<div[^>]*class="layer_wrap"[^>]*>([\s\S]*?)(?:<\/div>\s*){2,}/i);
        if (layerWrapMatch) {
          layerContent = layerWrapMatch[1];
          console.log('layer_wrap에서 내용 추출 성공');
        } else {
          // 방법 2: 전체 li 내용에서 직접 테이블 찾기
          console.log('layer_wrap 매칭 실패, 전체에서 테이블 검색');
          layerContent = listItemContent;
        }
        
        console.log(`layerContent 길이: ${layerContent.length}`);
        
        if (layerContent) {
          
          // 테이블에서 재고 정보 찾기 (더 유연한 패턴)
          const stockPatterns = [
            /<th[^>]*>ㆍ재고\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /<th[^>]*>재고\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /재고[\s]*:[\s]*([^<\n]+)/i
          ];
          
          for (const pattern of stockPatterns) {
            const stockMatch = layerContent.match(pattern);
            if (stockMatch) {
              const stockText = stockMatch[1].trim();
              console.log(`재고 텍스트: ${stockText}`);
              
              if (stockText === '품절' || stockText.includes('품절')) {
                stock = 0;
              } else {
                // "80 개" 형태에서 숫자만 추출
                const stockNumber = stockText.match(/(\d+)/);
                if (stockNumber) {
                  stock = parseInt(stockNumber[1]);
                }
              }
              break; // 하나 찾으면 중단
            }
          }
          
          // 가격 정보 추출 (더 유연한 패턴)
          const pricePatterns = [
            /<th[^>]*>ㆍ가격\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /<th[^>]*>가격\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /가격[\s]*:[\s]*([^<\n]+)/i
          ];
          
          for (const pattern of pricePatterns) {
            const priceMatch = layerContent.match(pattern);
            if (priceMatch) {
              const priceText = priceMatch[1].trim();
              // "14,000 원" 형태에서 숫자만 추출
              const priceNumber = priceText.replace(/[,원\s]/g, '');
              if (!isNaN(parseInt(priceNumber))) {
                price = parseInt(priceNumber);
              }
              break;
            }
          }
          
          // 제조사 정보 추출 (더 유연한 패턴)
          const manufacturerPatterns = [
            /<th[^>]*>ㆍ제조사\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /<th[^>]*>제조사\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /제조사[\s]*:[\s]*([^<\n]+)/i
          ];
          
          for (const pattern of manufacturerPatterns) {
            const manufacturerMatch = layerContent.match(pattern);
            if (manufacturerMatch) {
              manufacturer = manufacturerMatch[1].trim();
              break;
            }
          }
          
          // 규격 정보 추출 (크기 대신, 더 유연한 패턴)
          const sizePatterns = [
            /<th[^>]*>ㆍ규격\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /<th[^>]*>규격\s*:\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i,
            /규격[\s]*:[\s]*([^<\n]+)/i
          ];
          
          for (const pattern of sizePatterns) {
            const sizeMatch = layerContent.match(pattern);
            if (sizeMatch) {
              size = sizeMatch[1].trim();
              break;
            }
          }
        } else {
          console.log('layerContent가 비어있음 - 재고 정보 파싱 불가');
        }
        
        // 제조사가 추출되지 않았으면 상품명에서 추출 시도
        if (!manufacturer) {
          manufacturer = extractManufacturer(productName);
        }
        
        console.log(`파싱 결과: ${productName} - 재고: ${stock}개, 가격: ${price}원, 제조사: ${manufacturer}`);
        
        products.push({
          name: productName,
          size: size,
          manufacturer: manufacturer,
          price: price,
          stock: stock,
          store: {
            code: storeCode,
            name: storeName,
            region,
          },
        });
      }
    }
    
    console.log(`총 ${products.length}개 상품 파싱 완료`);
    
  } catch (error) {
    console.error('HTML 파싱 오류:', error);
  }

  return products;
};

// 상품명에서 제조사를 추출하는 함수 (토이저러스 상품 중심)
const extractManufacturer = (productName: string): string => {
  const manufacturers = [
    '반다이남코코리아', '반다이', '남코', '타카라토미', '토미', 
    '레고', '굿스마일컴퍼니', '맥팔레인', '플레이메이트', '젝스토이즈',
    '피그마', '넨도로이드', '코토부키야', '메디코스', '바르미에',
    '오뚜기', '농심', '서울우유', '매일유업', '남양유업', '롯데', '오리온', '크라운', '삼양', '동원'
  ];
  
  for (const manufacturer of manufacturers) {
    if (productName.includes(manufacturer)) {
      return manufacturer;
    }
  }
  
  return '기타';
};

// 토이저러스와 그랑그로서리 매장명 조회 함수 (실제 API 확인된 매장 코드)
const getStoreName = (region: Region, storeCode: string): string => {
  const storeMap: Record<string, string> = {
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
  if (storeMap[storeCode]) {
    return storeMap[storeCode];
  }
  
  // 매장 코드를 찾지 못한 경우 디버깅 로그
  console.warn(`매장 코드 ${storeCode}에 대한 매장명을 찾을 수 없습니다. 지역: ${region}`);
  
  // 기본적으로 지역명 + 매장으로 반환하지만, 이상적으로는 모든 매장 코드가 매핑되어야 함
  return `${region} 지역 매장 (코드: ${storeCode})`;
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
    const storeName = getStoreName(region, storeCode);
    const timeouts = getTimeoutForConnection();

    // 실제 롯데마트 API 호출 (프록시 사용) - 브라우저 호환성 개선
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeouts.product) : null; // 동적 타임아웃
    
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...getBrowserHeaders(),
      },
      body: new URLSearchParams({
        p_area: region,
        p_market: storeCode,
        p_schWord: keyword,
      }).toString(),
    };
    
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    
    const response = await fetchWithRetry(
      `${PROXY_BASE_URL}/product/search_product.asp`,
      fetchOptions
    );
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const html = await response.text();
    
    // HTML 응답 디버깅을 위한 로그 (첫 1000자만)
    console.log(`=== HTML 응답 디버깅 (${region} ${storeName}) ===`);
    console.log(html.substring(0, 1000));
    console.log('=== HTML 응답 끝 ===');
    
    const products = parseProductListFromHtml(html, region, storeCode, storeName);

    console.log(`${region} ${storeName}에서 "${keyword}" 검색 결과: ${products.length}개`);
    return products;
    
  } catch (error) {
    const { browser, isMobile } = getBrowserInfo();
    
    // 타임아웃이나 AbortError 처리
    const timeouts = getTimeoutForConnection();
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] 상품 검색 타임아웃 (${region} - ${storeCode}) - ${timeouts.product/1000}초 초과`);
    } else if (error instanceof Error && error.message.includes('signal')) {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] 상품 검색 중 중단됨 (${region} - ${storeCode})`);
    } else if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] 상품 검색 네트워크 오류 (${region} - ${storeCode}):`, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
    } else {
      console.error(`[${browser}-${isMobile ? 'mobile' : 'pc'}] 상품 검색 실패 (${region} - ${storeCode}):`, {
        error: error instanceof Error ? error.message : String(error),
        type: typeof error,
        name: error instanceof Error ? error.name : 'unknown'
      });
    }
    return [];
  }
};

/**
 * 모든 지역의 모든 매장에서 상품을 검색하는 함수 (네트워크 부하 최적화)
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
      
      console.log(`${region} 지역: 전체 ${stores.length}개 매장 중 ${filteredStores.length}개 매장(토이저러스/그랑그로서리)을 검색합니다.`);
      
      // 매장을 배치로 나누어 처리 (한 번에 3개씩만)
      const batchSize = 3;
      for (let i = 0; i < filteredStores.length; i += batchSize) {
        const batch = filteredStores.slice(i, i + batchSize);
        console.log(`${region} 지역 ${i + 1}-${Math.min(i + batchSize, filteredStores.length)}/${filteredStores.length} 매장 검색 중...`);
        
        // 배치 내에서는 병렬 처리
        const batchProducts = await Promise.allSettled(
          batch.map(store => searchProductsInStore(region, store.code, keyword))
        );

        // 성공한 결과들만 수집
        batchProducts.forEach((result) => {
          if (result.status === 'fulfilled') {
            allProducts.push(...result.value);
          }
        });

        // 배치 간 딜레이 (네트워크 부하 방지)
        if (i + batchSize < filteredStores.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        }
      }

      // 지역 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
