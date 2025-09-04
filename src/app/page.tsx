import InventoryChecker from '@/components/InventoryChecker';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🧸 롯데 토이저러스, 그랑그로서리 검색
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            서울, 경기 지역 토이저러스와 그랑그로서리 매장의 상품 재고를 한 번에 확인하세요
          </p>
        </header>
        
        <main>
          <InventoryChecker />
        </main>
        
        <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>※ 재고 수량은 실시간 판매 상황에 따라 실제와 다를 수 있습니다</p>
        </footer>
      </div>
    </div>
  );
}
