'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Star, Navigation, Search } from 'lucide-react';

interface Restaurant {
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    distance: number | null;
    rating: number;
    address: string;
    isOpen?: boolean;
}

function RecommendContent() {
    const searchParams = useSearchParams();
    const initialMenu = searchParams?.get('menu') || '';
    const initialLat = searchParams?.get('lat');
    const initialLng = searchParams?.get('lng');

    const DEFAULT_LAT = 37.5615;
    const DEFAULT_LNG = 127.0034;

    const [loading, setLoading] = useState(false);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
        initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : null
    );
    const [error, setError] = useState<string | null>(null);
    const [menu, setMenu] = useState(initialMenu);

    // Auto-search if menu/location is provided
    useEffect(() => {
        if ((initialMenu || (initialLat && initialLng)) && !restaurants.length) {
            handleSearch(location?.lat || DEFAULT_LAT, location?.lng || DEFAULT_LNG);
        }
    }, [initialMenu, initialLat, initialLng]);

    const handleSearch = async (forcedLat?: number, forcedLng?: number) => {
        setLoading(true);
        setError(null);
        setRestaurants([]);

        let lat = forcedLat || DEFAULT_LAT;
        let lng = forcedLng || DEFAULT_LNG;

        setLocation({ lat, lng });

        try {
            const res = await fetch(`/api/restaurants?lat=${lat}&lng=${lng}&menu=${encodeURIComponent(menu)}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setRestaurants(data.restaurants);
        } catch (err) {
            console.error(err);
            setError('식당 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-enter pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2.5 bg-white hover:bg-orange-50 rounded-full transition-colors shadow-sm border border-gray-100 group">
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    <span className="text-primary">회사 주변</span> 맛집 지도
                </h1>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-xl shadow-orange-100/50 flex items-center gap-2 border border-orange-100 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                <div className="p-3 text-orange-400">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={menu}
                    onChange={(e) => setMenu(e.target.value)}
                    placeholder="먹고 싶은 메뉴 (예: 김치찌개)"
                    className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder:text-gray-400 h-10 text-slate-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={() => handleSearch()}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-md shadow-orange-200"
                >
                    상세 검색
                </button>
            </div>

            <div className="flex justify-center">
                <Link href="/" className="text-sm font-bold text-orange-500 hover:underline flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> 다른 지역에서 찾고 싶으신가요? (홈에서 다시 검색)
                </Link>
            </div>

            {!location && !loading && !error && (
                <div className="py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm mb-4 animate-bounce-slow">
                        🏢
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">회사 주변 맛집을 확인합니다</h2>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            회사 반경 내의 <span className="text-primary font-bold">"{menu || '맛집'}"</span>을 찾아드려요!
                        </p>
                    </div>
                    <button
                        onClick={() => handleSearch()}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-1"
                    >
                        회사 주변 맛집 찾기
                    </button>
                </div>
            )}

            {loading && (
                <div className="py-20 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-orange-100 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium">주변 맛집을 스캔하고 있습니다...</p>
                </div>
            )}

            {error && (
                <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center border border-red-100">
                    <p className="font-bold mb-2">오류가 발생했습니다</p>
                    <p>{error}</p>
                    <button
                        onClick={handleSearch}
                        className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm hover:bg-red-50 font-medium"
                    >
                        다시 시도하기
                    </button>
                </div>
            )}

            {restaurants.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 pb-2">
                        <span className="font-bold text-slate-900 text-lg">검색 결과 {restaurants.length}곳</span>
                        <span className="text-sm text-slate-500 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">반경 1km</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {restaurants.map((place) => (
                            <a
                                key={place.id}
                                href={`https://map.naver.com/p/search/${encodeURIComponent(place.name)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="group block bg-white p-5 rounded-[1.25rem] shadow-sm border border-orange-50 hover:shadow-md hover:shadow-orange-100/50 transition-all duration-300 hover:border-orange-200 hover:scale-[1.01]"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors line-clamp-1">{place.name}</h3>
                                            {place.isOpen === true && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">영업중</span>}
                                            {place.isOpen === false && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">영업종료</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-2 line-clamp-1">{place.address || '주소 정보 없음'}</p>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">{place.category || '식당'}</span>
                                            <span className="flex items-center gap-1 text-yellow-500 font-bold">
                                                <Star className="w-3.5 h-3.5 fill-current" /> {place.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-[#03C75A] group-hover:text-white transition-all duration-300 shadow-sm">
                                            <span className="font-bold text-xs">N지도</span>
                                        </div>
                                        {place.distance && (
                                            <span className="text-xs font-bold text-primary">{place.distance}m</span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RecommendPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading...</div>}>
            <RecommendContent />
        </Suspense>
    );
}
