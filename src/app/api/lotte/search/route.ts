import { NextRequest, NextResponse } from 'next/server';
import { Product, Region } from '@/types/lotte';

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

export async function POST(request: NextRequest) {
  try {
    const { region, storeCode, keyword } = await request.json();

    if (!region || !storeCode || !keyword) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    const storeName = getStoreName(region as Region, storeCode);

    // 실제 롯데마트 API 호출
    const response = await fetch(
      'https://company.lottemart.com/mobiledowa/product/search_product.asp',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://company.lottemart.com/mobiledowa/',
        },
        body: new URLSearchParams({
          p_area: region,
          p_market: storeCode,
          p_schWord: keyword,
        }).toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const html = await response.text();
    
    // HTML 응답 디버깅을 위한 로그 (첫 1000자만)
    console.log(`=== HTML 응답 디버깅 (${region} ${storeName}) ===`);
    console.log(html.substring(0, 1000));
    console.log('=== HTML 응답 끝 ===');
    
    const products = parseProductListFromHtml(html, region as Region, storeCode, storeName);

    console.log(`${region} ${storeName}에서 "${keyword}" 검색 결과: ${products.length}개`);
    return NextResponse.json(products);
    
  } catch (error) {
    console.error('상품 검색 오류:', error);
    return NextResponse.json(
      { error: '상품 검색에 실패했습니다' },
      { status: 500 }
    );
  }
}
