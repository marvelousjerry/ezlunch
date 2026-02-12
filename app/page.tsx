'use client';

import Header from '@/components/Header';
import LunchRoulette from '@/components/LunchRoulette';
import dynamic from 'next/dynamic';

const MapBackground = dynamic(() => import('@/components/MapBackground'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden font-sans text-gray-900">
      {/* Background Map */}
      <div className="fixed inset-0 z-0">
        <MapBackground />
      </div>

      <Header />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-24 px-4">
        {/* Hero Section */}
        <section className="mb-6 text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#2F3438] mb-2 tracking-tight">
            오늘 뭐 먹지?
          </h1>
        </section>

        <div className="w-full max-w-lg animate-enter">
          <LunchRoulette />
        </div>

        <div className="absolute bottom-6 text-center text-xs text-gray-400 font-medium">
          Based on Google Maps & OpenStreetMap Data
        </div>
      </div>
    </main>
  );
}
