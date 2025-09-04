'use client';

import React, { useState } from 'react';
import { searchAllStores, groupProductsByRegion } from '@/lib/lotteApi';
import { RegionGroup } from '@/types/lotte';
import SearchForm from './SearchForm';
import ResultsList from './ResultsList';
import LoadingSpinner from './LoadingSpinner';

const InventoryChecker: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<RegionGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState<string>('');

  const handleSearch = async (searchKeyword: string) => {
    if (!searchKeyword.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchedKeyword(searchKeyword);

    try {
      console.log(`"${searchKeyword}" 검색 시작...`);
      
      // 모든 매장에서 상품 검색
      const allProducts = await searchAllStores(searchKeyword);
      
      console.log(`총 ${allProducts.length}개 상품 발견`);
      
      // 재고가 있는 상품들만 필터링하고 지역별 그룹화
      const groupedResults = groupProductsByRegion(allProducts);
      
      console.log(`재고가 있는 상품: ${groupedResults.length}개 지역`);
      
      setResults(groupedResults);
      
      if (groupedResults.length === 0) {
        setError('재고가 있는 상품을 찾을 수 없습니다');
      }
      
    } catch (err) {
      console.error('검색 중 오류 발생:', err);
      
      // 에러 타입에 따른 구체적인 메시지 제공
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('네트워크 응답 시간이 초과되었습니다. Wi-Fi 환경에서 다시 시도해주세요.');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('네트워크 연결을 확인하고 다시 시도해주세요. 모바일에서는 Wi-Fi 사용을 권장합니다.');
        } else {
          setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* 검색 폼 */}
      <SearchForm
        keyword={keyword}
        setKeyword={setKeyword}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && <LoadingSpinner />}

      {/* 검색 결과 */}
      {!isLoading && results.length > 0 && (
        <ResultsList 
          results={results} 
          searchedKeyword={searchedKeyword}
        />
      )}
    </div>
  );
};

export default InventoryChecker;
