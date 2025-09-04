'use client';

import React from 'react';
import { RegionGroup } from '@/types/lotte';

interface ResultsListProps {
  results: RegionGroup[];
  searchedKeyword: string;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, searchedKeyword }) => {
  const totalProducts = results.reduce((total, region) => 
    total + region.stores.reduce((storeTotal, store) => 
      storeTotal + store.products.length, 0), 0
  );

  const totalStores = results.reduce((total, region) => 
    total + region.stores.length, 0
  );

  return (
    <div className="mt-8 space-y-6">
      {/* 검색 결과 요약 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            "{searchedKeyword}" 검색 결과
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {results.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">지역</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalStores}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">매장</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalProducts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">상품</div>
          </div>
        </div>
      </div>

      {/* 지역별 결과 */}
      <div className="space-y-6">
        {results.map((regionGroup, regionIndex) => (
          <div 
            key={regionGroup.region}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* 지역 헤더 */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">📍</span>
                {regionGroup.region}
                <span className="text-sm font-normal opacity-90">
                  ({regionGroup.stores.length}개 매장)
                </span>
              </h3>
            </div>
            
            {/* 매장별 상품 목록 */}
            <div className="p-6 space-y-6">
              {regionGroup.stores.map((store, storeIndex) => (
                <div key={`${store.storeName}-${storeIndex}`} className="border-l-4 border-blue-400 pl-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-blue-500">🏪</span>
                    {store.storeName}
                    <span className="text-sm font-normal text-gray-500">
                      ({store.products.length}개 상품)
                    </span>
                  </h4>
                  
                  <div className="space-y-2">
                    {store.products.map((product, productIndex) => (
                      <div 
                        key={`${product.name}-${productIndex}`}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-white">
                            {productIndex + 1}. {product.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {product.size}
                            {product.manufacturer && ` • ${product.manufacturer}`}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {product.price > 0 && (
                            <div className="text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400">가격</div>
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {product.price.toLocaleString()}원
                              </div>
                            </div>
                          )}
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-500 dark:text-gray-400">재고</div>
                            <div className={`font-bold text-lg ${
                              product.stock > 10 
                                ? 'text-green-600 dark:text-green-400' 
                                : product.stock > 0 
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {product.stock}개
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsList;
