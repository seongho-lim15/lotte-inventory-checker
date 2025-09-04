'use client';

import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="mt-8 text-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center space-y-4">
          {/* 메인 로딩 스피너 */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
          </div>
          
          {/* 로딩 메시지 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              수도권 롯데마트 매장 검색 중...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              서울, 경기, 인천 3개 지역의 매장을 확인하고 있습니다
            </p>
          </div>
          
          {/* 진행 표시 바 */}
          <div className="w-full max-w-md">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full animate-pulse" 
                   style={{ width: '100%' }} />
            </div>
          </div>
          
          {/* 추가 정보 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• 서울, 경기, 인천 (수도권 지역만 검색)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
