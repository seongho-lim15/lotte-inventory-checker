import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 환경 최적화
  experimental: {
    // serverComponentsExternalPackages: [], // 필요시 외부 패키지 추가
  },
  // API 라우트 최적화
  api: {
    bodyParser: {
      sizeLimit: '1mb', // API 요청 크기 제한
    },
    responseLimit: '4mb', // API 응답 크기 제한
  },
  // 성능 최적화
  compress: true,
  // 환경 변수
  env: {
    VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
};

export default nextConfig;
