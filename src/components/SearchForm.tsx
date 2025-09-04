'use client';

import React from 'react';

interface SearchFormProps {
  keyword: string;
  setKeyword: (keyword: string) => void;
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  keyword,
  setKeyword,
  onSearch,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="search-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            상품명을 입력하세요
          </label>
          <div className="flex gap-3">
            <input
              id="search-input"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="예: 쿠지, 우유, 라면..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-500 dark:placeholder-gray-400"
              aria-label="상품 검색어 입력"
              tabIndex={0}
            />
            <button
              type="submit"
              disabled={isLoading || !keyword.trim()}
              onClick={() => onSearch(keyword)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white font-medium rounded-lg transition-colors
                       disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="상품 검색 실행"
              tabIndex={0}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  검색중...
                </div>
              ) : (
                <>
                  🔍 전체 매장 검색
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>💡 전국 롯데마트 매장을 검색하여 재고가 있는 상품만 표시합니다</p>
          <p>⏱️ 검색에는 약 30초~1분 정도 소요될 수 있습니다</p>
          <p>📱 모바일에서는 Wi-Fi 환경에서 사용하시는 것을 권장합니다</p>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
